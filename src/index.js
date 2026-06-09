import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Datadog RUM: 첫 렌더를 막지 않도록 idle 타임에 비동기 초기화
if (typeof window !== 'undefined') {
  const initDatadog = async () => {
    try {
      const [{ datadogRum }, { reactPlugin }] = await Promise.all([
        import('@datadog/browser-rum'),
        import('@datadog/browser-rum-react'),
      ]);
      datadogRum.init({
        applicationId: '5c8676fb-3a76-4b21-a3be-faec3feed7a3',
        clientToken: 'pubbf6a2ced8ab05caba26a02e38c69a0ef',
        site: 'us3.datadoghq.com',
        service: 'vocaraon-web',
        env: 'prod',
        version: '1.0.0',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        trackResources: true,
        trackUserInteractions: true,
        trackLongTasks: true,
        plugins: [reactPlugin({ router: false })],
      });
    } catch (e) {
      // Datadog 초기화 실패는 앱 동작에 영향 없음
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(initDatadog);
  } else {
    setTimeout(initDatadog, 2000);
  }
}

// ✅ 알림 서비스를 위한 서비스 워커 등록 (배포 환경에서 필수)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('Firebase Service Worker registered:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
