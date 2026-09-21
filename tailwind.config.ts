import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        yt: {
          bg: "#0e0508", // near-black with a red tint
          surface: "#1c0a10", // dark maroon
          hover: "#2b0f16",
          border: "#402028",
          red: "#c1121f", // deep crimson primary
          crimson: "#e5383b",
          pink: "#ff4d6d", // hot pink accent
          rose: "#ff8fa3",
          text: "#f7ecef",
          muted: "#c08b95",
        },
      },
      boxShadow: {
        "neon-sm": "0 0 8px rgba(255, 77, 109, 0.45)",
        neon: "0 0 16px rgba(255, 77, 109, 0.45), 0 0 40px rgba(193, 18, 31, 0.25)",
        "neon-lg": "0 0 24px rgba(255, 77, 109, 0.55), 0 0 64px rgba(193, 18, 31, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
