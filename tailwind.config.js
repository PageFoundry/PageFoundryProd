/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // ── Core palette ──
        pfBg:          "#000000",
        pfSurface:     "#080808",
        pfCard:        "#0d0d0d",
        pfCardHover:   "#131313",
        pfText:        "#f0ede8",
        pfSubtle:      "rgba(240,237,232,0.5)",
        pfMuted:       "rgba(240,237,232,0.22)",

        // ── Accent (refined gold) ──
        pfAccent:      "#c9a84c",
        pfAccentWarm:  "#e8c96a",
        pfAccentDim:   "rgba(201,168,76,0.08)",

        // ── Borders ──
        pfBorder:      "rgba(255,255,255,0.06)",
        pfBorderMid:   "rgba(255,255,255,0.12)",
        pfBorderAccent: "rgba(201,168,76,0.35)",

        // ── Semantic ──
        pfDanger:      "#8b2020",
        pfSuccess:     "#1f6b45",

        // ── pfOrange kept as alias → now points to gold for zero-migration ──
        pfOrange:      "#c9a84c",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans:    ["var(--font-body)",    "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)",    "Courier New", "monospace"],
      },
      borderRadius: {
        xl:   "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card:   "0 20px 80px -10px rgba(0,0,0,0.7)",
        accent: "0 0 24px rgba(201,168,76,0.18)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
