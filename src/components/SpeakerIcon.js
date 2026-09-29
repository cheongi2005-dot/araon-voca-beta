import React from 'react';

export default function SpeakerIcon({ size = 24, muted = false, className = '' }) {
  return <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true" focusable="false" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M5 11h5l7-6v22l-7-6H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" fill="currentColor" />
    {muted ? <path d="m23 12 6 8m0-8-6 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /> : <><path d="M22 11c3 3 3 7 0 10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /><path d="M26 7c5 5 5 13 0 18" stroke="currentColor" strokeOpacity=".5" strokeWidth="2.4" strokeLinecap="round" /></>}
  </svg>;
}
