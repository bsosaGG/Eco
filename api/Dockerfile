# Usar la versión de Node.js especificada (LTS suele ser más estable, pero seguimos la especificación)
# Nota: La versión LTS más reciente a mi conocimiento es 20.x. Node 22 es "Current".
# Si "v22.16.01" es un typo y quisiste decir Node 20.x, puedes usar node:20-alpine.
# Por ahora, usaré node:22-alpine asumiendo que la versión es correcta.
FROM node:22-alpine

# Establecer el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

# Exponer el puerto que la aplicación usa
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD [ "node", "src/server.js" ]