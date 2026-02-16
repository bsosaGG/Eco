# Usar la versión de Node.js especificada (LTS suele ser más estable, pero seguimos la especificación)
# Nota: La versión LTS más reciente a mi conocimiento es 20.x. Node 22 es "Current".
# Si "v22.16.01" es un typo y quisiste decir Node 20.x, puedes usar node:20-alpine.
# Por ahora, usaré node:22-alpine asumiendo que la versión es correcta.
FROM node:22-alpine

# Instalar LibreOffice y dependencias necesarias (Java, fuentes)
RUN apk add --no-cache \
    libreoffice \
    openjdk11-jre \
    ttf-freefont \
    font-carlito \
    font-croscore \
    udev \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    font-noto-cjk \
    terminus-font \
    ttf-liberation

# Instalar Caladea (Cambria) manualmente ya que no está en repositorios
RUN mkdir -p /usr/share/fonts/caladea && \
    wget -q https://github.com/google/fonts/raw/main/ofl/caladea/Caladea-Regular.ttf -P /usr/share/fonts/caladea && \
    wget -q https://github.com/google/fonts/raw/main/ofl/caladea/Caladea-Bold.ttf -P /usr/share/fonts/caladea && \
    wget -q https://github.com/google/fonts/raw/main/ofl/caladea/Caladea-Italic.ttf -P /usr/share/fonts/caladea && \
    wget -q https://github.com/google/fonts/raw/main/ofl/caladea/Caladea-BoldItalic.ttf -P /usr/share/fonts/caladea && \
    fc-cache -f


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