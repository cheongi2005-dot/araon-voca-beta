import 'pretendard/dist/web/static/pretendard.css';
import React from 'react';
// BrowserRouter를 Router로 임포트
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MyVoca from './pages/MyVoca';
import LevelTemplate from './pages/LevelTemplate';

function App() {
  return (
    /**
     * basename: 프로젝트가 /araon-voca-beta 경로에서 실행 중임을 라우터에 알립니다.
     * future: v7 업데이트 대비 경고창을 제거합니다.
     */
    <Router 
      basename="/araon-voca-beta" 
      future={{ 
        v7_startTransition: true, 
        v7_relativeSplatPath: true 
      }}
    >
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/my-voca" element={<MyVoca />} />
          {/* 이제 /araon-voca-beta/ 이후에 오는 값만 levelId로 들어옵니다! */}
          <Route path="/:levelId" element={<LevelTemplate />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;