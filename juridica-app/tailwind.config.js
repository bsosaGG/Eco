/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1e40af', // Example custom color
                secondary: '#1e293b',
            }
        },
    },
    plugins: [],
}
