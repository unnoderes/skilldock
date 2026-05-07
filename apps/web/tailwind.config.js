/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f1115",
        foreground: "#e1e4e8",
        panel: "#161b22",
        sidebar: "#0d1117",
        border: "#30363d",
        primary: "#2f81f7",
        success: "#238636",
        error: "#da3633",
        warning: "#d29922",
        running: "#9e6a03",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
