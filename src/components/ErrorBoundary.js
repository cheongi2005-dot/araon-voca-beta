import React from 'react';

// 렌더링 중 예상 못한 오류(undefined 데이터 접근 등)가 나도 흰 화면 대신
// 복구 화면을 보여줍니다. 상태가 꼬였을 수 있으므로 재시도는 하드 리로드로 처리합니다.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-8 text-center bg-[#F8F9FA] dark:bg-[#0A0A0B]">
          <span className="text-5xl">😵</span>
          <div>
            <h2 className="text-lg font-black dark:text-white mb-1">일시적인 오류가 발생했어요</h2>
            <p className="text-sm text-zinc-400 font-bold">불편을 드려 죄송해요. 다시 시도해 주세요.</p>
          </div>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="px-8 py-4 rounded-2xl font-black text-white shadow-md active:scale-95 transition-all"
            style={{ backgroundColor: '#70011D' }}
          >
            홈으로 돌아가기
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
