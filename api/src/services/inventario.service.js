const { inventarioPool } = require("../config/db-inventario");
const XLSX = require("xlsx");

class InventarioService {
  constructor() {
    this.client = inventarioPool;
  }

  // Función auxiliar para convertir el número de serie de Excel a formato 'YYYY-MM-DD'
  // que PostgreSQL puede entender para el tipo DATE.
  convertExcelDateToISO(excelDateSerial) {
    if (typeof excelDateSerial === "number") {
      // 1900-01-01 es la fecha base predeterminada para Excel en Windows.
      // Ajuste para la diferencia de días entre la fecha base de Excel y JavaScript (1899-12-30 es día 0 en Excel para 1900-01-00)
      // La librería XLSX ya maneja esto con SSF.format.
      const dateString = XLSX.SSF.format("yyyy-mm-dd", excelDateSerial);
      const parsedDate = new Date(dateString);
      if (isNaN(parsedDate.getTime())) {
        console.warn(
          `Advertencia: No se pudo parsear la fecha de Excel: ${excelDateSerial}. Devolviendo null.`
        );
        return null;
      }
      return dateString; // Retorna 'YYYY-MM-DD'
    }
    // Si ya es un string (ej. "2025-04-09") o cualquier otro formato, intentar parsearlo directamente
    if (typeof excelDateSerial === "string") {
      const parsedDate = new Date(excelDateSerial);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split("T")[0]; // Asegura formato YYYY-MM-DD
      }
    }
    return null; // Si no es un número ni un string de fecha válido, retorna null
  }

  // --- Métodos de Búsqueda y Obtención (sin cambios) ---

  async getAllItems(limit = 100, offset = 0) {
    const query = `
            SELECT ii.*, p.nombre AS proveedor_nombre, f.numero_factura, f.serie_factura, f.fecha_factura,
                   ri.nombre AS renglon_nombre, ud.nombre AS unidad_direccion_nombre
            FROM inventario_items ii
            LEFT JOIN facturas f ON ii.id_factura = f.id
            LEFT JOIN proveedores p ON f.id_proveedor = p.id
            LEFT JOIN renglones_inventario ri ON ii.id_renglon = ri.id
            LEFT JOIN unidades_direcciones ud ON ii.id_unidad_direccion = ud.id
            ORDER BY ii.no_item DESC
            LIMIT $1 OFFSET $2;
        `;
    const result = await this.client.query(query, [limit, offset]);
    return result.rows;
  }

  async getItemByCodigo(codigo) {
    const query = `
            SELECT ii.*, p.nombre AS proveedor_nombre, f.numero_factura, f.serie_factura, f.fecha_factura,
                   ri.nombre AS renglon_nombre, ud.nombre AS unidad_direccion_nombre
            FROM inventario_items ii
            LEFT JOIN facturas f ON ii.id_factura = f.id
            LEFT JOIN proveedores p ON f.id_proveedor = p.id
            LEFT JOIN renglones_inventario ri ON ii.id_renglon = ri.id
            LEFT JOIN unidades_direcciones ud ON ii.id_unidad_direccion = ud.id
            WHERE ii.codigo = $1;
        `;
    const result = await this.client.query(query, [codigo]);
    return result.rows[0];
  }

  // Método para buscar items por libro y folio
  async getItemsByLibroFolio(libro, folio, limit = 100, offset = 0) {
    const query = `
            SELECT ii.*, p.nombre AS proveedor_nombre, f.numero_factura, f.serie_factura, f.fecha_factura,
                   ri.nombre AS renglon_nombre, ud.nombre AS unidad_direccion_nombre
            FROM inventario_items ii
            LEFT JOIN facturas f ON ii.id_factura = f.id
            LEFT JOIN proveedores p ON f.id_proveedor = p.id
            LEFT JOIN renglones_inventario ri ON ii.id_renglon = ri.id
            LEFT JOIN unidades_direcciones ud ON ii.id_unidad_direccion = ud.id
            WHERE ii.libro = $1 AND ii.folio = $2
            ORDER BY ii.no_item DESC
            LIMIT $3 OFFSET $4;
        `;
    const result = await this.client.query(query, [
      libro,
      folio,
      limit,
      offset,
    ]);
    return result.rows;
  }

  // --- Métodos de Creación, Actualización, Eliminación ---

  async createItem(itemData) {
    const {
      fecha_factura_str, // Esto vendrá del Excel como string o número
      proveedor_nombre,
      factura_numero,
      factura_serie,
      renglon_nombre,
      fecha_registro_str, // Renombrado para claridad, ya que es el string/número de Excel
      codigo,
      descripcion_fisica,
      valor,
      libro,
      folio,
      responsable,
      unidad_direccion_nombre,
      no_tarjeta_responsabilidad,
      observaciones,
    } = itemData;

    const client = await this.client.connect();
    try {
      await client.query("BEGIN"); // Iniciar transacción

      // 1. Manejar Proveedor
      let id_proveedor;
      let resultProveedor = await client.query(
        "SELECT id FROM proveedores WHERE nombre = $1",
        [proveedor_nombre]
      );
      if (resultProveedor.rows.length === 0) {
        resultProveedor = await client.query(
          "INSERT INTO proveedores(nombre) VALUES($1) RETURNING id",
          [proveedor_nombre]
        );
        id_proveedor = resultProveedor.rows[0].id;
      } else {
        id_proveedor = resultProveedor.rows[0].id;
      }

      // 2. Manejar Factura
      let id_factura;
      // Convertir fecha_factura_str (del Excel) a formato DATE para PostgreSQL
      const fecha_factura = this.convertExcelDateToISO(fecha_factura_str);
      if (!fecha_factura) {
        // Verificar si la fecha formateada es nula
        throw new Error(
          `Fecha de factura inválida o no formateable: ${fecha_factura_str}`
        );
      }

      let resultFactura = await client.query(
        "SELECT id FROM facturas WHERE numero_factura = $1 AND serie_factura = $2 AND id_proveedor = $3",
        [factura_numero, factura_serie, id_proveedor]
      );
      if (resultFactura.rows.length === 0) {
        resultFactura = await client.query(
          "INSERT INTO facturas(numero_factura, serie_factura, fecha_factura, id_proveedor) VALUES($1, $2, $3, $4) RETURNING id",
          [factura_numero, factura_serie, fecha_factura, id_proveedor] // Usar fecha_factura formateada
        );
        id_factura = resultFactura.rows[0].id;
      } else {
        id_factura = resultFactura.rows[0].id;
      }

      // 3. Manejar Renglon
      let id_renglon;
      let resultRenglon = await client.query(
        "SELECT id FROM renglones_inventario WHERE nombre = $1",
        [renglon_nombre]
      );
      if (resultRenglon.rows.length === 0) {
        resultRenglon = await client.query(
          "INSERT INTO renglones_inventario(nombre) VALUES($1) RETURNING id",
          [renglon_nombre]
        );
        id_renglon = resultRenglon.rows[0].id;
      } else {
        id_renglon = resultRenglon.rows[0].id;
      }

      // 4. Manejar Unidad/Direccion
      let id_unidad_direccion;
      let resultUnidad = await client.query(
        "SELECT id FROM unidades_direcciones WHERE nombre = $1",
        [unidad_direccion_nombre]
      );
      if (resultUnidad.rows.length === 0 && unidad_direccion_nombre) {
        resultUnidad = await client.query(
          "INSERT INTO unidades_direcciones(nombre) VALUES($1) RETURNING id",
          [unidad_direccion_nombre]
        );
        id_unidad_direccion = resultUnidad.rows[0].id;
      } else if (resultUnidad.rows.length > 0) {
        id_unidad_direccion = resultUnidad.rows[0].id;
      } else {
        // Si unidad_direccion_nombre es null/undefined y no existe, id_unidad_direccion será null
        id_unidad_direccion = null;
      }

      // Convertir fecha_registro_str (del Excel) a formato DATE para PostgreSQL
      const fecha_registro_formatted =
        this.convertExcelDateToISO(fecha_registro_str);
      // No se lanza error aquí, si es null, se inserta null en la DB si la columna lo permite.

      // 5. Insertar o actualizar Item de Inventario
      const insertItemQuery = `
                 INSERT INTO inventario_items(
                     id_factura, id_renglon, fecha_registro, codigo, descripcion_fisica,
                     valor, libro, folio, responsable, id_unidad_direccion,
                     no_tarjeta_responsabilidad, observaciones
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 ON CONFLICT (codigo) DO UPDATE SET
                     id_factura = EXCLUDED.id_factura,
                     id_renglon = EXCLUDED.id_renglon,
                     fecha_registro = EXCLUDED.fecha_registro,
                     descripcion_fisica = EXCLUDED.descripcion_fisica,
                     valor = EXCLUDED.valor,
                     libro = EXCLUDED.libro,
                     folio = EXCLUDED.folio,
                     responsable = EXCLUDED.responsable,
                     id_unidad_direccion = EXCLUDED.id_unidad_direccion,
                     no_tarjeta_responsabilidad = EXCLUDED.no_tarjeta_responsabilidad,
                     observaciones = EXCLUDED.observaciones
                 RETURNING *;
             `;
      const resultItem = await client.query(insertItemQuery, [
        id_factura,
        id_renglon,
        fecha_registro_formatted, // Usar fecha_registro_formatted
        codigo,
        descripcion_fisica,
        valor,
        libro,
        folio,
        responsable,
        id_unidad_direccion,
        no_tarjeta_responsabilidad,
        observaciones,
      ]);

      await client.query("COMMIT"); // Confirmar transacción
      return resultItem.rows[0];
    } catch (error) {
      await client.query("ROLLBACK"); // Revertir transacción en caso de error
      console.error("Error creating/updating inventory item:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateItem(codigo, itemData) {
    const {
      fecha_factura_str, // Esto vendrá del Excel como string o número
      proveedor_nombre,
      factura_numero,
      factura_serie,
      renglon_nombre,
      fecha_registro_str, // Renombrado
      descripcion_fisica,
      valor,
      libro,
      folio,
      responsable,
      unidad_direccion_nombre,
      no_tarjeta_responsabilidad,
      observaciones,
    } = itemData;

    const client = await this.client.connect();
    try {
      await client.query("BEGIN"); // Iniciar transacción

      // 1. Manejar Proveedor (similar a createItem)
      let id_proveedor;
      let resultProveedor = await client.query(
        "SELECT id FROM proveedores WHERE nombre = $1",
        [proveedor_nombre]
      );
      if (resultProveedor.rows.length === 0) {
        resultProveedor = await client.query(
          "INSERT INTO proveedores(nombre) VALUES($1) RETURNING id",
          [proveedor_nombre]
        );
        id_proveedor = resultProveedor.rows[0].id;
      } else {
        id_proveedor = resultProveedor.rows[0].id;
      }

      // 2. Manejar Factura (similar a createItem)
      let id_factura;
      const fecha_factura = this.convertExcelDateToISO(fecha_factura_str);
      if (!fecha_factura) {
        throw new Error(
          `Fecha de factura inválida o no formateable: ${fecha_factura_str}`
        );
      }

      let resultFactura = await client.query(
        "SELECT id FROM facturas WHERE numero_factura = $1 AND serie_factura = $2 AND id_proveedor = $3",
        [factura_numero, factura_serie, id_proveedor]
      );
      if (resultFactura.rows.length === 0) {
        resultFactura = await client.query(
          "INSERT INTO facturas(numero_factura, serie_factura, fecha_factura, id_proveedor) VALUES($1, $2, $3, $4) RETURNING id",
          [factura_numero, factura_serie, fecha_factura, id_proveedor]
        );
        id_factura = resultFactura.rows[0].id;
      } else {
        id_factura = resultFactura.rows[0].id;
      }

      // 3. Manejar Renglon (similar a createItem)
      let id_renglon;
      let resultRenglon = await client.query(
        "SELECT id FROM renglones_inventario WHERE nombre = $1",
        [renglon_nombre]
      );
      if (resultRenglon.rows.length === 0) {
        resultRenglon = await client.query(
          "INSERT INTO renglones_inventario(nombre) VALUES($1) RETURNING id",
          [renglon_nombre]
        );
        id_renglon = resultRenglon.rows[0].id;
      } else {
        id_renglon = resultRenglon.rows[0].id;
      }

      // 4. Manejar Unidad/Direccion (similar a createItem)
      let id_unidad_direccion;
      let resultUnidad = await client.query(
        "SELECT id FROM unidades_direcciones WHERE nombre = $1",
        [unidad_direccion_nombre]
      );
      if (resultUnidad.rows.length === 0) {
        resultUnidad = await client.query(
          "INSERT INTO unidades_direcciones(nombre) VALUES($1) RETURNING id",
          [unidad_direccion_nombre]
        );
        id_unidad_direccion = resultUnidad.rows[0].id;
      } else {
        id_unidad_direccion = resultUnidad.rows[0].id;
      }

      const fecha_registro_formatted =
        this.convertExcelDateToISO(fecha_registro_str);

      // 5. Actualizar Item de Inventario
      const updateItemQuery = `
                 UPDATE inventario_items SET
                     id_factura = $1,
                     id_renglon = $2,
                     fecha_registro = $3,
                     descripcion_fisica = $4,
                     valor = $5,
                     libro = $6,
                     folio = $7,
                     responsable = $8,
                     id_unidad_direccion = $9,
                     no_tarjeta_responsabilidad = $10,
                     observaciones = $11
                 WHERE codigo = $12
                 RETURNING *;
             `;
      const resultItem = await client.query(updateItemQuery, [
        id_factura,
        id_renglon,
        fecha_registro_formatted, // Usar fecha_registro_formatted
        descripcion_fisica,
        valor,
        libro,
        folio,
        responsable,
        id_unidad_direccion,
        no_tarjeta_responsabilidad,
        observaciones,
        codigo,
      ]);

      await client.query("COMMIT"); // Confirmar transacción
      return resultItem.rows[0];
    } catch (error) {
      await client.query("ROLLBACK"); // Revertir transacción en caso de error
      console.error("Error updating inventory item:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteItem(codigo) {
    const query = "DELETE FROM inventario_items WHERE codigo = $1 RETURNING *;";
    const result = await this.client.query(query, [codigo]);
    return result.rows[0];
  }

  async uploadExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetNameList = workbook.SheetNames;
    const excelData = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetNameList[0]],
      { header: 1, raw: true } // Importante: raw: true para obtener los números de serie de las fechas
    );

    // Asumiendo que la primera fila es el encabezado
    const headers = excelData[0];
    const dataRows = excelData.slice(1);

    const results = {
      totalRows: 0, // Ajustado para contar solo las filas con datos
      successfulImports: 0,
      failedImports: [],
      errors: [],
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      // --- INICIO DE LA CORRECCIÓN PARA FILAS VACÍAS ---
      // Detectar si la fila está completamente vacía (todos los valores son null, undefined o string vacíos)
      // Se considera una fila vacía si todas las celdas en las primeras 14 columnas son nulas/vacías.
      // Ajusta el '14' si tus datos relevantes pueden ir más allá de la columna N.
      const isRowEffectivelyEmpty = row
        .slice(0, 14)
        .every(
          (cell) =>
            cell === null ||
            typeof cell === "undefined" ||
            (typeof cell === "string" && cell.trim() === "")
        );

      if (isRowEffectivelyEmpty) {
        console.log(
          `Deteniendo lectura en fila de Excel ${
            i + 2
          } debido a fila vacía o sin datos relevantes.`
        );
        break; // Detiene el bucle
      }
      // --- FIN DE LA CORRECCIÓN PARA FILAS VACÍAS ---

      results.totalRows++; // Contar solo las filas que no son vacías

      try {
        // Validaciones básicas antes de intentar procesar la fila
        if (!row || row.length < 11) {
          throw new Error(
            `Fila ${i + 2}: Incompleta. Se esperan al menos 11 columnas.`
          );
        }
        if (!row[6] || (typeof row[6] === "string" && row[6].trim() === "")) {
          // 'codigo' es UNIQUE NOT NULL
          throw new Error(`Fila ${i + 2}: El campo 'CÓDIGO' es nulo o vacío.`);
        }

        const itemData = {
          no_item_excel: row[0],
          fecha_factura_str: row[1], // Valor numérico o string tal cual de Excel
          proveedor_nombre: row[2],
          factura_completa: row[3],
          renglon_nombre: row[4],
          fecha_registro_str: row[5], // Valor numérico o string tal cual de Excel
          codigo: row[6],
          descripcion_fisica: row[7],
          valor: parseFloat(String(row[8]).replace("Q", "").replace(",", "")),
          libro_y_folio_completo: row[9],
          responsable: row[10],
          unidad_direccion_nombre: row[11],
          no_tarjeta_responsabilidad: row[12],
          observaciones: row[13],
        };

        // Parsear Factura:
        const facturaMatch = itemData.factura_completa.match(
          /Factura\s+No\.\s(\d+)\sSerie\s([A-Z0-9]+)/
        );
        if (!facturaMatch) {
          throw new Error(
            `Fila ${i + 2}: Formato de factura inválido: ${
              itemData.factura_completa
            }`
          );
        }
        itemData.factura_numero = facturaMatch[1];
        itemData.factura_serie = facturaMatch[2];

        // Parsear Libro y Folio:
        const libroFolioMatch = itemData.libro_y_folio_completo.match(
          /L\d+\s*(\d+)\s*\/\s*FOLIO\s*(\d+)/
        );
        if (!libroFolioMatch) {
          throw new Error(
            `Fila ${i + 2}: Formato de Libro y Folio inválido: ${
              itemData.libro_y_folio_completo
            }`
          );
        }
        itemData.libro = parseInt(libroFolioMatch[1], 10);
        itemData.folio = parseInt(libroFolioMatch[2], 10);

        // Remover campos combinados para el createItem
        delete itemData.factura_completa;
        delete itemData.libro_y_folio_completo;
        delete itemData.no_item_excel;

        // Llamar a createItem con los datos preparados
        await this.createItem(itemData);
        results.successfulImports++;
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error.message);
        results.failedImports.push({
          row: i + 2,
          error: error.message,
          data: row,
        });
        results.errors.push(error.message);
      }
    }
    return results;
  }

  // --- Métodos para las tablas de referencia (CRUD básico) ---
  async createProveedor(nombre, nit = null) {
    const query =
      "INSERT INTO proveedores(nombre, nit) VALUES($1, $2) ON CONFLICT (nombre) DO NOTHING RETURNING *;";
    const result = await this.client.query(query, [nombre, nit]);
    return result.rows[0];
  }

  async getProveedorByName(nombre) {
    const query = "SELECT * FROM proveedores WHERE nombre = $1;";
    const result = await this.client.query(query, [nombre]);
    return result.rows[0];
  }

  async createRenglon(nombre) {
    const query =
      "INSERT INTO renglones_inventario(nombre) VALUES($1) ON CONFLICT (nombre) DO NOTHING RETURNING *;";
    const result = await this.client.query(query, [nombre]);
    return result.rows[0];
  }

  async getRenglonByName(nombre) {
    const query = "SELECT * FROM renglones_inventario WHERE nombre = $1;";
    const result = await this.client.query(query, [nombre]);
    return result.rows[0];
  }

  async createUnidadDireccion(nombre, descripcion = null) {
    const query =
      "INSERT INTO unidades_direcciones(nombre, descripcion) VALUES($1, $2) ON CONFLICT (nombre) DO NOTHING RETURNING *;";
    const result = await this.client.query(query, [nombre, descripcion]);
    return result.rows[0];
  }

  async getUnidadDireccionByName(nombre) {
    const query = "SELECT * FROM unidades_direcciones WHERE nombre = $1;";
    const result = await this.client.query(query, [nombre]);
    return result.rows[0];
  }
}

module.exports = new InventarioService();
