import React from 'react';
export default function QuizModeIcon({ mode, size = 28 }) {
 return <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
  {mode === 'choice' ? <><rect x="3" y="4" width="26" height="24" rx="3" fill="currentColor" opacity=".16"/><path d="m7 10 2 2 3-4 M15 10h9 M15 17h9 M15 24h9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="17" r="1.5" fill="currentColor"/><circle cx="9" cy="24" r="1.5" fill="currentColor"/></> : mode === 'letter' ? <><rect x="3" y="7" width="26" height="19" rx="3" fill="currentColor" opacity=".16"/><path d="m7 21 4-10 4 10 M8.5 17h5 M20 11h5 M22.5 11v10 M20 21h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></> : <><rect x="2" y="6" width="28" height="21" rx="3" fill="currentColor" opacity=".18"/><path d="M7 11h1m4 0h1m4 0h1m4 0h3 M7 16h1m4 0h1m4 0h1m4 0h3 M10 22h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></>}
 </svg>;
}
