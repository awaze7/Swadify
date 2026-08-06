/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        /*
         * The auth screens and the CraveAI widget were both built around a
         * hardcoded `#FFC72C`, repeated as an arbitrary-value class in sixteen
         * places across four files. It is the brand accent, but it existed
         * nowhere in the theme, so it could not be referenced by opacity
         * modifiers or found by anyone reading the config to learn the palette.
         * `crave` is the same colour, now addressable as `bg-crave`,
         * `ring-crave/30`, and so on.
         */
        crave: "#FFC72C",
        "crave-tint": "#FFF6DD",
        /*
         * On neutrals: the app runs two ramps on purpose, not by accident.
         * `gray-*` (cool) is the default for the ordering flow - home, menu,
         * cart, checkout, profile. `stone-*` (warm) is confined to the auth
         * screens and the CraveAI widget, where it pairs with the warm `crave`
         * accent above. The split is clean - none of those five files contain a
         * single `gray-*` class. Pick the ramp that matches the surface you are
         * on and don't mix them within one component; `Button`'s `primaryWarm`
         * variant exists so the shared primitive can cross into warm surfaces.
         */
      },
      keyframes: {
        // SortDropdown.jsx uses `animate-fadeIn` on its popover, but the
        // utility was never defined here and index.css only holds the three
        // @tailwind directives, so the class compiled to nothing and the
        // popover appeared with no transition at all.
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Was a hand-written <style> block injected inside
        // RestaurantCarousel's JSX, so it re-rendered with the component and
        // sat outside the theme entirely. The -50% is what makes the loop
        // seamless: the track holds two copies of the list, so translating by
        // half its width lands exactly on the start of the second copy.
        infiniteScroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 150ms ease-out both",
        "infinite-scroll": "infiniteScroll 90s linear infinite",
      },
    },
  },
  plugins: [],
}

