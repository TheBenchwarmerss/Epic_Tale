import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        logo: ["Pirata One"],
        main: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: [
      {
        "epic-dark": {
          "primary": "#FF0000",      // Pure Red as requested
          "primary-content": "#ffffff",
          "secondary": "#f87171",    // Lighter Red
          "secondary-content": "#ffffff",
          "accent": "#fbbf24",       // Amber/Gold for contrast
          "accent-content": "#1a1a1a",
          "neutral": "#0b0c10",      // Deepest dark for Header/Footer
          "neutral-content": "#f3f4f6",
          "base-100": "#0f1115",     // Main background
          "base-200": "#1a1d24",     // Card background
          "base-300": "#22262f",     // Borders, elevated backgrounds
          "base-content": "#e5e7eb", // Main text color
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#FF0000",
        },
        "epic-light": {
          "primary": "#FF0000",      // Pure Red as requested
          "primary-content": "#ffffff",
          "secondary": "#f87171",
          "secondary-content": "#ffffff",
          "accent": "#d97706",       // Darker amber for better light mode contrast
          "accent-content": "#ffffff",
          "neutral": "#1f2937",      // Dark grey for header/footer
          "neutral-content": "#ffffff",
          "base-100": "#f3f4f6",     // Light grey background
          "base-200": "#ffffff",     // White cards
          "base-300": "#e5e7eb",     // Borders
          "base-content": "#111827", // Dark text
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#FF0000",
        },
      },
    ],
  },
}
