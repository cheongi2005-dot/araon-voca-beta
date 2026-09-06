/** @type {import('tailwindcss').Config} */
// 색상 값의 단일 출처는 src/config/theme.js 입니다.
// 인라인 style에서 쓰는 값은 그쪽을, 클래스로 쓰는 값은 아래 이름을 사용하세요.
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2A61FF",
        /** 오답노트 / 나의 단어장 브랜드 컬러 */
        brand: {
          DEFAULT: "#70011D",
          dark: "#FF4D4D",
          tint: "#FDF2F2",
        },
        /** 화면 바탕과 카드 배경 */
        surface: {
          page: "#F8F9FA",
          "page-dark": "#0A0A0B",
          card: "#FFFFFF",
          "card-dark": "#1E1E1E",
        },
        /** 주간 그래프의 학습 시간 막대 */
        studytime: "#34D399",
      },
    },
  },
  plugins: [],
};
