// Importamos la clase Pool del paquete 'pg', que es el driver de PostgreSQL para Node.js.
// Un "Pool" gestiona múltiples conexiones de clientes para reutilizarlas, lo cual es más eficiente
// que abrir y cerrar una conexión por cada consulta.
const { Pool } = require("pg");

// Importamos y configuramos 'dotenv' para cargar las variables de entorno desde el archivo .env.
// Aunque es probable que ya lo hagas en tu archivo principal de la app, incluirlo aquí
// hace que este módulo sea más robusto y autocontenido.
require("dotenv").config();

// Creamos una nueva instancia del Pool.
const pool = new Pool({
  // La 'connectionString' es la clave. Aquí le decimos al pool cómo encontrar la base de datos.
  // Lee la variable de entorno 'DOCUMENTOS_DATABASE_URL' que definimos en el Paso B
  // en los archivos docker-compose.yml y .env.
  // Esta única línea contiene el usuario, la contraseña, el host, el puerto y el nombre de la base de datos.
  connectionString: process.env.DOCUMENTOS_DATABASE_URL,

  // Mantenemos ssl: false, siguiendo tu patrón existente. Esto es común y seguro
  // para la comunicación entre contenedores dentro de la misma red de Docker,
  // ya que la red interna se considera un entorno de confianza.
  ssl: false,
});

// (Opcional pero recomendado) Añadimos un listener para el evento 'connect'.
// Esto imprimirá un mensaje en la consola cada vez que se establezca una nueva conexión con la BD,
// lo cual es muy útil para depurar y confirmar que la conexión funciona.
pool.on("connect", () => {
  console.log("Base de Datos de Documentos conectada exitosamente.");
});

// (Opcional pero recomendado) Añadimos un listener para el evento 'error'.
// Esto es crucial para detectar y registrar cualquier error en las conexiones inactivas del pool.
pool.on("error", (err, client) => {
  console.error(
    "Error inesperado en el cliente inactivo del pool de Documentos",
    err
  );
  process.exit(-1);
});

// Exportamos un objeto con un único método: 'query'.
// Este es el patrón que estableciste. Abstrae el pool de conexiones del resto de la aplicación.
// Cualquier otra parte de tu código (servicios, controladores) no necesitará interactuar
// directamente con el 'pool', simplemente llamará a dbDocumentos.query().
module.exports = {
  query: (text, params) => pool.query(text, params),
};
