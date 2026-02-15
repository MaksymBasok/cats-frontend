import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#002040",
          orange: "#F0A050",
          steel: "#607070",
          bg: "#F7F8FA",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
