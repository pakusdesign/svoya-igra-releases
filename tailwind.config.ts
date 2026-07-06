import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        board: "#071a46",
        boardLine: "#19407f",
        prize: "#ffd84d",
        ink: "#f5f7fb"
      }
    }
  },
  plugins: []
};

export default config;
