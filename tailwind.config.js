/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
"./src/app/**/*.{js,ts,jsx,tsx}",
"./src/components/**/*.{js,ts,jsx,tsx}"
],
theme: {
extend: {
colors: {
pfBg: "#000000",
pfText: "#ffffff",
pfSubtle: "#a1a1aa",
pfBorder: "rgba(255,255,255,0.1)",
pfCard: "rgba(255,255,255,0.05)",
pfOrange: "#FFA500"
},
borderRadius: {
xl: "1rem",
'2xl': '1.5rem',
'3xl': '2rem'
},
boxShadow: {
card: "0 30px 120px -10px rgba(0,0,0,0.8)",
},
backdropBlur: {
xs: '2px',
}
},
},
plugins: [],
};