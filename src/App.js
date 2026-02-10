import 'pretendard/dist/web/static/pretendard.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MyVoca from './pages/MyVoca';
import LevelTemplate from './pages/LevelTemplate';

function App() {
  /**
   * 💡 해결 포인트:
   * Vercel은 루트(/) 경로를 기본으로 사용합니다. 
   * 기존의 '/araon-voca-beta'는 GitHub Pages용 경로였기 때문에, 
   * Vercel에서는 이를 지우거나 '/'로 설정해야 화면이 정상적으로 출력됩니다.
   */
  return (
    <Router 
      future={{ 
        v7_startTransition: true, 
        v7_relativeSplatPath: true 
      }}
    >
      <div className="App">
        <Routes>
          {/* 기본 홈 화면 */}
          <Route path="/" element={<Home />} />
          
          {/* 나의 단어장 페이지 */}
          <Route path="/my-voca" element={<MyVoca />} />
          
          {/* 레벨별 학습 페이지 (Level1, Elementary100 등) */}
          <Route path="/:levelId" element={<LevelTemplate />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;