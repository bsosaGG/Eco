# /opt/scripts/export_db_cli_data.py
# -*- coding: utf-8 -*-
import sys
import subprocess
import csv
import re # Importar el módulo de expresiones regulares

# --- CONFIGURACIÓN DE LA BASE DE DATOS ---
DB_NAME = "planific_planificacion"
DB_USER = "planific_usuari"
DB_PASS = "tSnNYhZjAMi3tSnNYhZjAMi3"
DB_HOST = "localhost" # Desde la perspectiva del servidor Fedora

# --- DELIMITADORES ESPECIALES ---
START_DELIMITER_PREFIX = "---START_TABLE:"
END_DELIMITER_PREFIX = "---END_TABLE:"
DELIMITER_SUFFIX = "---"

def export_table_via_cli(table_name, start_date=None, end_date=None):
    """
    Exporta una tabla específica utilizando el comando 'mysql' de línea de comandos.
    Las fechas/horas se procesan para asegurar que sean tratadas como strings en la hoja de cálculo.
    """
    try:
        # Imprimir el delimitador de inicio de tabla
        print "%s %s %s" % (START_DELIMITER_PREFIX, table_name, DELIMITER_SUFFIX)

        # Construir la consulta SQL con los filtros opcionales de fecha
        query = "SELECT * FROM `%s`" % table_name
        conditions = []
        if start_date:
            conditions.append("`fecha` >= '%s'" % start_date)
        if end_date:
            conditions.append("`fecha` < '%s'" % end_date)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        # Construir el comando 'mysql'.
        mysql_command = [
            "mysql",
            "-h", DB_HOST,
            "-u", DB_USER,
            "-p%s" % DB_PASS,
            DB_NAME,
            "--batch",
            "--raw",
            "-e", query
        ]

        # Ejecutar el comando externo
        process = subprocess.Popen(mysql_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            sys.stderr.write("Error ejecutando 'mysql' para tabla %s: %s\n" % (table_name, stderr))
        else:
            # La salida de mysql --batch --raw es tab-separated (TSV).
            # Convertimos TSV a CSV aquí en Python, procesando las fechas.
            tsv_reader = csv.reader(stdout.splitlines(), delimiter='\t')
            csv_writer = csv.writer(sys.stdout)

            # Leer la cabecera
            header = next(tsv_reader, None)
            if header:
                csv_writer.writerow(header) # Escribir la cabecera tal cual

            # Procesar las filas de datos
            for row in tsv_reader:
                processed_row = []
                for item in row:
                    item_str = str(item) # Asegurar que el elemento es una cadena

                    # Regex para detectar formatos comunes de fecha/hora (ISO 8601 sin zona horaria)
                    # YYYY-MM-DD
                    # YYYY-MM-DD HH:MM:SS
                    # YYYY-MM-DD HH:MM:SS.microseconds
                    date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2}(\.\d+)?)?$")

                    if date_pattern.match(item_str):
                        # Si parece una fecha/hora, le anteponemos un apóstrofe para forzar formato de texto en Excel
                        processed_row.append("d: " + item_str)
                    else:
                        processed_row.append(item_str)
                csv_writer.writerow(processed_row)

        # Imprimir el delimitador de fin de tabla
        print "%s %s %s" % (END_DELIMITER_PREFIX, table_name, DELIMITER_SUFFIX)

    except OSError as e:
        sys.stderr.write("Error: El comando 'mysql' no se encontró o no tiene permisos de ejecución. %s\n" % str(e))
    except Exception as e:
        sys.stderr.write("Error general en script Python para tabla %s: %s\n" % (table_name, str(e)))

if __name__ == "__main__":
    start_date = None
    end_date = None
    table_names = []

    # Parsear los argumentos opcionales y separar los nombres de las tablas
    for arg in sys.argv[1:]:
        if arg.startswith("--start-date="):
            start_date = arg.split("=", 1)[1]
        elif arg.startswith("--end-date="):
            end_date = arg.split("=", 1)[1]
        else:
            table_names.append(arg)

    if not table_names:
        sys.stderr.write("Uso: python %s [--start-date=YYYY-MM-DD] [--end-date=YYYY-MM-DD] <nombre_tabla1> [nombre_tabla2 ...]\n" % sys.argv[0])
        sys.exit(1)

    for table_name in table_names:
        export_table_via_cli(table_name, start_date=start_date, end_date=end_date)
