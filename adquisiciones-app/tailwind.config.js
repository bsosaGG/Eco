/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Paleta tomada del sitio institucional de SCSPR (scspr.gob.gt)
                primary: {
                    DEFAULT: '#0b1f45', // Azul marino (header / sidebar)
                    light: '#14336b',
                },
                accent: {
                    DEFAULT: '#1e88e5', // Azul institucional (botones, links activos)
                    light: '#29abe2',
                },
            }
        },
    },
    plugins: [],
}
