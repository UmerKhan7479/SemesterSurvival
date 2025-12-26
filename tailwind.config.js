/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0f172a", // Dark slate
                surface: "#1e293b",
                primary: "#3b82f6", // Blue 500
                secondary: "#ec4899", // Pink 500
                accent: "#06b6d4", // Cyan 500
                success: "#22c55e",
                warning: "#eab308",
                danger: "#ef4444",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
