import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { navy: "#0B1B34", white: "#FFFFFF" },
        primary: { light: "#4f46e5", dark: "#6366f1" },
      },
    },
  },
  plugins: [],
};
export default config;
