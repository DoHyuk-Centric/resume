const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html"],
  theme: {
    screens: {
      content: "988px",
      ...defaultTheme.screens,
    },
    extend: {
      fontFamily: {
        sans: ["Pretendard", "Noto Sans KR", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        ink: "#1F2430",
        muted: "#6B7280",
        faint: "#B0B6C0",
        canvas: "#FBFCFE",
        line: "#E7E9EE",
        brand1: "#1D3FE0",
        brand2: "#1657E0",
        brand3: "#0F84D6",
        brand4: "#08B7C9",
      },
    },
  },
  plugins: [],
};
