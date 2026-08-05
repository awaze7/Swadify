/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // SortDropdown.jsx uses `animate-fadeIn` on its popover, but the
        // utility was never defined here and index.css only holds the three
        // @tailwind directives — so the class compiled to nothing and the
        // popover appeared with no transition at all.
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 150ms ease-out both",
      },
    },
  },
  plugins: [],
}

