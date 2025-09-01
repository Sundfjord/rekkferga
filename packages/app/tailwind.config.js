/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Enable class-based dark mode
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["Montserrat-Regular", "sans-serif"],
        "montserrat-bold": ["Montserrat-Bold", "sans-serif"],
        oswald: ["Oswald-Regular", "sans-serif"],
        "oswald-bold": ["Oswald-Bold", "sans-serif"],
        "bebas-neue": ["BebasNeue-Regular", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          light: "var(--color-primary-light)",
          dark: "var(--color-primary-dark)",
          on: "var(--color-on-primary)",
        },

        surface: {
          DEFAULT: "var(--color-surface)",
          variant: "var(--color-surface-variant)",
          on: "var(--color-on-surface)",
        },

        background: {
          DEFAULT: "var(--color-background)",
          on: "var(--color-on-background)",
        },

        border: {
          DEFAULT: "var(--color-border)",
          variant: "var(--color-border-variant)",
        },

        error: {
          DEFAULT: "var(--color-error)",
          on: "var(--color-on-error)",
        },

        success: {
          DEFAULT: "var(--color-success)",
          on: "var(--color-on-success)",
        },
      },
    },
  },
  plugins: [],
};
