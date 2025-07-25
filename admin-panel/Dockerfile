# ---- Etapa 1: Build ----
# Usa una imagen de Node para compilar la aplicación Vue
FROM node:20-alpine AS build

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de manifiesto del proyecto y el lockfile
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código fuente de la aplicación
COPY . .

# Ejecuta el script de build para generar los archivos estáticos
RUN npm run build


# ---- Etapa 2: Production ----
# Usa una imagen de Nginx muy ligera para servir los archivos
FROM nginx:1.27-alpine AS production

# Establece el directorio de trabajo para Nginx
WORKDIR /usr/share/nginx/html

# Elimina el contenido por defecto de Nginx
RUN rm -rf ./*

# Copia los archivos compilados desde la etapa 'build'
COPY --from=build /app/dist .

# Copia el archivo de configuración personalizado de Nginx
# Lo crearemos en el siguiente paso
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80, que es el puerto por defecto de Nginx
EXPOSE 80

# Comando para iniciar el servidor Nginx
CMD ["nginx", "-g", "daemon off;"]