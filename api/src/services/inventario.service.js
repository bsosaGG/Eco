const { inventarioPool } = require("../config/db-inventario");
const XLSX = require("xlsx");

class InventarioService {
  constructor() {
    this.client = inventarioPool;
  }

  // --- Métodos de Búsqueda y Obtención (con consideración de índices futuros) ---

  async getAllItems(limit = 100, offset = 0) {
    // Implementar paginación. Los índices se crearán en la base de datos.
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
      fecha_factura_str, // Esto vendrá del Excel como string
      proveedor_nombre,
      factura_numero,
      factura_serie,
      renglon_nombre,
      fecha_registro,
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
      // Convertir fecha_factura_str a formato Date
      const fecha_factura = fecha_factura_str
        ? new Date(fecha_factura_str)
        : null;
      if (!fecha_factura || isNaN(fecha_factura.getTime())) {
        throw new Error(`Fecha de factura inválida: ${fecha_factura_str}`);
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
      if (resultUnidad.rows.length === 0) {
        resultUnidad = await client.query(
          "INSERT INTO unidades_direcciones(nombre) VALUES($1) RETURNING id",
          [unidad_direccion_nombre]
        );
        id_unidad_direccion = resultUnidad.rows[0].id;
      } else {
        id_unidad_direccion = resultUnidad.rows[0].id;
      }

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
        fecha_registro ? new Date(fecha_registro) : null,
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
      fecha_factura_str, // Esto vendrá del Excel como string
      proveedor_nombre,
      factura_numero,
      factura_serie,
      renglon_nombre,
      fecha_registro,
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
      const fecha_factura = fecha_factura_str
        ? new Date(fecha_factura_str)
        : null;
      if (!fecha_factura || isNaN(fecha_factura.getTime())) {
        throw new Error(`Fecha de factura inválida: ${fecha_factura_str}`);
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
        fecha_registro ? new Date(fecha_registro) : null,
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
      { header: 1 }
    );

    // Asumiendo que la primera fila es el encabezado
    const headers = excelData[0];
    const dataRows = excelData.slice(1);

    const results = {
      totalRows: dataRows.length,
      successfulImports: 0,
      failedImports: [],
      errors: [],
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      try {
        const itemData = {
          no_item_excel: row[0],
          fecha_factura_str: row[1],
          proveedor_nombre: row[2],
          factura_completa: row[3],
          renglon_nombre: row[4],
          fecha_registro: row[5],
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
            `Formato de factura inválido: ${itemData.factura_completa}`
          );
        }
        itemData.factura_numero = facturaMatch[1];
        itemData.factura_serie = facturaMatch[2];

        // --- INICIO DE LA CORRECCIÓN PARA LIBRO Y FOLIO ---
        // Parsear Libro y Folio: "L2 42745 / FOLIO 1649" -> Libro: 42745, Folio: 1649
        const libroFolioMatch = itemData.libro_y_folio_completo.match(
          /L\d+\s*(\d+)\s*\/\s*FOLIO\s*(\d+)/
        );
        if (!libroFolioMatch) {
          throw new Error(
            `Formato de Libro y Folio inválido: ${itemData.libro_y_folio_completo}`
          );
        }
        itemData.libro = parseInt(libroFolioMatch[1], 10); // Captura el primer grupo de dígitos después de L#
        itemData.folio = parseInt(libroFolioMatch[2], 10); // Captura el segundo grupo de dígitos después de FOLIO
        // --- FIN DE LA CORRECCIÓN PARA LIBRO Y FOLIO ---

        // Remover campos combinados para el createItem
        delete itemData.factura_completa;
        delete itemData.libro_y_folio_completo;
        delete itemData.no_item_excel;

        await this.createItem(itemData);
        results.successfulImports++;
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error.message);
        break;
        // results.failedImports.push({
        //   row: i + 2,
        //   error: error.message,
        //   data: row,
        // });
        // results.errors.push(error.message);
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
