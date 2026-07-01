/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: '#6366f1',
          indigoHover: '#4f46e5',
          emerald: '#10b981',
          emeraldHover: '#059669',
          danger: '#ef4444',
          dangerHover: '#dc2626',
        }
      }
    },
  },
  plugins: [],
}
