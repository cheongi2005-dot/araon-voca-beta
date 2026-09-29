/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fraunces', 'Wanted Sans', 'sans-serif'],
      },
      colors: {
        primary: "#2A61FF"
      },
      // 모바일에서 100vh는 주소창 뒤까지 포함해 페이지가 조금씩 스크롤됐다 → 실제 보이는 높이(dvh)로
      minHeight: { screen: '100dvh' },
      height: { screen: '100dvh' },
      keyframes: {
        // 단어 카드 더미 넘김 (components/PageTurn.js). 왼쪽 아래 모서리 축이라 회전해도 카드가 아래로 삐져나오지 않는다(세로 스크롤바 방지).
        'card-fly-out': { from: { transform: 'none' }, to: { transform: 'translateX(-130%) rotate(-16deg)' } },
        'card-fly-in': { from: { transform: 'translateX(-130%) rotate(-16deg)' }, to: { transform: 'none' } },
        'card-rise': { from: { transform: 'scale(.9)', opacity: '.5' }, to: { transform: 'none', opacity: '1' } },
        'card-sink': { from: { transform: 'none', opacity: '1' }, to: { transform: 'scale(.9)', opacity: '.5' } },
      },
      animation: {
        'card-fly-out': 'card-fly-out .42s ease-in forwards',
        'card-fly-in': 'card-fly-in .42s cubic-bezier(.2,.8,.2,1) forwards',
        'card-rise': 'card-rise .42s cubic-bezier(.2,.8,.2,1)',
        'card-sink': 'card-sink .42s cubic-bezier(.2,.8,.2,1) forwards',
      },
    },
  },
  plugins: [],
}

