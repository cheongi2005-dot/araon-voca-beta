import SpeakerIcon from './SpeakerIcon';
import React from 'react';

// Approved Araon flat illustration palette. SVG stays crisp at badge sizes.
export default function AraonIcon({ name, size = 24, label, tone, monochrome = false, className = '', style }) {
  const tones = { burgundy: ['#81364F', '#BF8294'], blue: ['#397FC1', '#81B4DB'], amber: ['#BA8426', '#E9BC59'], green: ['#27866A', '#78BBA2'], red: ['#BD4E60', '#DD8B95'], navy: ['#466195', '#90A6C8'], silver: ['#74889A', '#B7C3CC'] };
  const defaults = { bell: 'blue', voice: 'amber', privacy: 'green', logout: 'red', clock: 'green', words: 'amber', sun: 'amber', moon: 'navy', level: 'navy', help: 'navy', music: 'navy', hint: 'amber', review: 'red', passion: 'red', check: 'green', silver: 'silver', bronze: 'amber', performance: 'navy', activity: 'navy', question: 'blue' };
  const [wine, accent] = monochrome ? ['currentColor', 'currentColor'] : tones[tone || defaults[name]] || tones.burgundy;
  const clay = monochrome ? 'currentColor' : '#CA7956', cream = '#F8F1E5';
  if (name === 'voice') return <span role={label ? 'img' : undefined} aria-label={label || undefined} className={className} style={{ color: wine, display: 'inline-flex', flexShrink: 0, ...style }}><SpeakerIcon size={size} /></span>;
  const medal = name === 'silver' || name === 'bronze';
  const shapes = {
    sprout: <><path d="M32 53 V29" stroke={wine} strokeWidth="5" strokeLinecap="round"/><path d="M31 37 C13 38 9 27 10 17 C24 16 33 24 31 37Z" fill={accent}/><path d="M33 29 C32 15 42 8 55 10 C55 24 46 32 33 29Z" fill={wine}/><path d="M18 55 H46" stroke={clay} strokeWidth="5" strokeLinecap="round"/></>,
    compass: <><circle cx="32" cy="33" r="24" fill={accent}/><circle cx="32" cy="33" r="18" fill={cream}/><path d="M41 18 L36 37 L23 48 L28 29Z" fill={wine}/><path d="M41 18 L36 37 L28 29Z" fill={clay}/><path d="M28 5 H36" stroke={wine} strokeWidth="4" strokeLinecap="round"/></>,
    mountain: <><path d="M4 54 L24 19 L44 54Z" fill={accent}/><path d="M20 54 L42 10 L62 54Z" fill={wine}/><path d="M33 28 L42 10 L50 28 L42 24Z" fill={cream}/><circle cx="14" cy="12" r="6" fill={clay}/></>,
    rocket: <><path d="M22 35 L11 38 L7 52 L25 46 M29 42 L27 56 L41 51 L44 39" fill={accent}/><path d="M19 36 Q28 12 56 8 Q57 35 33 45Z" fill={wine}/><circle cx="41" cy="23" r="7" fill={cream}/><circle cx="41" cy="23" r="3.5" fill={accent}/><path d="M19 45 Q10 46 10 57 Q21 57 24 49Z" fill={clay}/></>,
    performance: <><rect x="8" y="10" width="48" height="34" rx="5" fill={accent}/><path d="M18 33 L28 24 L36 29 L46 19 M32 44 V55 M22 56 H42" fill="none" stroke={wine} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></>,
    activity: <><rect x="9" y="7" width="46" height="50" rx="6" fill={cream}/><path d="M26 19 H46 M26 32 H46 M26 45 H40" stroke={wine} strokeWidth="4" strokeLinecap="round"/><path d="M16 19 H17 M16 32 H17 M16 45 H17" stroke={accent} strokeWidth="5" strokeLinecap="round"/></>,
    music: <><path d="M25 43 V15 L51 10 V38 M25 22 L51 17" fill="none" stroke={wine} strokeWidth="5" strokeLinejoin="round"/><ellipse cx="18" cy="46" rx="10" ry="8" fill={accent}/><ellipse cx="44" cy="41" rx="10" ry="8" fill={accent}/></>,
    hint: <><path d="M21 43 C21 35 13 33 13 23 A19 19 0 0 1 51 23 C51 33 43 35 43 43Z" fill={accent}/><path d="M25 49 H39 M28 56 H36" stroke={wine} strokeWidth="5" strokeLinecap="round"/></>,
    review: <><path d="M49 22 A22 22 0 1 0 52 43" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round"/><path d="M49 9 V24 H34" fill="none" stroke={wine} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><path d="M25 32 H37 M25 40 H33" stroke={wine} strokeWidth="4" strokeLinecap="round"/></>,
    check: <><circle cx="32" cy="32" r="25" fill={wine}/><path d="M20 32 L28 40 L45 23" fill="none" stroke={cream} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></>,
    question: <><path d="M9 10 H55 V43 Q55 48 50 48 H25 L12 57 V48 H9 Q5 48 5 43 V15 Q5 10 9 10Z" fill={accent}/><path d="M25 23 C25 14 41 15 40 24 C40 30 32 28 32 34" fill="none" stroke={wine} strokeWidth="4" strokeLinecap="round"/><circle cx="32" cy="41" r="2.5" fill={wine}/></>,
    sun: <><circle cx="32" cy="32" r="13" fill={clay}/><path d="M32 6 V12 M32 52 V58 M6 32 H12 M52 32 H58 M14 14 L18 18 M46 46 L50 50 M14 50 L18 46 M46 18 L50 14" stroke={accent} strokeWidth="4" strokeLinecap="round"/></>,
    moon: <path d="M42 7 A25 25 0 1 0 57 43 A24 24 0 0 1 42 7Z" fill={accent}/>,
    words: <><path d="M7 12 Q21 9 30 17 V54 Q20 46 7 49Z" fill={accent}/><path d="M34 17 Q43 9 57 12 V49 Q44 46 34 54Z" fill={wine}/></>,
    clock: <><circle cx="32" cy="32" r="25" fill={accent}/><path d="M32 17 V33 L42 39" fill="none" stroke={cream} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></>,
    level: <><path d="M16 31 V43 Q32 56 48 43 V31Z" fill={accent}/><path d="M4 23 L32 9 L60 23 L32 37Z" fill={wine}/><path d="M55 27 V43" stroke={clay} strokeWidth="4" strokeLinecap="round"/></>,
    bell: <><path d="M13 44 C20 37 14 16 29 13 V10 Q32 6 35 10 V13 C50 16 44 37 51 44 Q53 48 48 48 H16 Q11 48 13 44Z" fill={accent}/><path d="M26 52 Q32 61 38 52Z" fill={wine}/></>,
    voice: <><path d="M8 24 H20 L36 11 V53 L20 40 H8 Q5 40 5 36 V28 Q5 24 8 24Z" fill={wine}/><path d="M44 23 Q52 32 44 41 M51 15 Q65 32 51 49" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round"/></>,
    help: <><path d="M12 34 V29 A20 20 0 0 1 52 29 V39 Q52 52 38 52" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round"/><rect x="8" y="28" width="12" height="19" rx="5" fill={wine}/><rect x="44" y="28" width="12" height="19" rx="5" fill={wine}/><rect x="29" y="48" width="13" height="7" rx="3.5" fill={clay}/></>,
    privacy: <><path d="M32 6 L54 14 V32 Q53 48 32 59 Q11 48 10 32 V14Z" fill={accent}/><path d="M22 32 L29 39 L43 24" fill="none" stroke={cream} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></>,
    logout: <><path d="M29 10 H13 Q9 10 9 14 V50 Q9 54 13 54 H29" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round"/><path d="M26 32 H56 M45 21 L56 32 L45 43" fill="none" stroke={wine} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></>,
    crown: <><path d="M8 23 Q7 19 11 21 L23 30 L30 13 Q32 9 34 13 L41 30 L53 21 Q57 19 56 23 L51 45 Q50 48 47 48 H17 Q14 48 13 45Z" fill={wine}/><circle cx="9" cy="20" r="3" fill={wine}/><circle cx="32" cy="11" r="3.5" fill={wine}/><circle cx="55" cy="20" r="3" fill={wine}/><path d="M32 29 L37 35 L32 41 L27 35Z" fill={cream}/><rect x="14" y="51" width="36" height="5" rx="2.5" fill={accent}/></>,
    passion: <><path d="M34 5 C38 22 51 23 51 39 A19 19 0 0 1 13 39 C13 26 29 20 34 5Z" fill={wine}/><path d="M32 29 C31 37 23 39 24 46 A8 8 0 0 0 40 46 C40 40 35 35 32 29Z" fill={clay}/></>,
    ranking: <><rect x="6" y="29" width="14" height="27" rx="3" fill={accent}/><rect x="25" y="9" width="14" height="47" rx="3" fill={wine}/><rect x="44" y="35" width="14" height="21" rx="3" fill={accent}/></>,
    sparkle: <path d="M32 5 Q37 26 59 32 Q37 38 32 59 Q26 38 5 32 Q26 26 32 5Z" fill={wine}/>,
    star: <path d="M30 7 Q32 3 34 7 L41 23 L58 25 Q62 26 58 30 L45 41 L48 57 Q49 61 45 59 L32 51 L18 59 Q14 61 15 56 L18 41 L5 30 Q2 26 6 25 L23 23Z" fill={accent}/>,
    book: <><rect x="12" y="6" width="40" height="52" rx="6" fill={wine}/><path d="M38 6 H46 V31 L42 27 L38 31Z" fill={cream}/><path d="M18 49 H48 V54 H18 Q14 52 18 49Z" fill={cream}/></>,
    settings: <><path d="M8 21 H56 M8 43 H56" stroke={wine} strokeWidth="5" strokeLinecap="round"/><circle cx="23" cy="21" r="8" fill={accent}/><circle cx="43" cy="43" r="8" fill={accent}/></>,
    report: <><rect x="12" y="6" width="40" height="52" rx="6" fill={cream} stroke={wine} strokeWidth="3"/><path d="M22 26 H42 M22 38 H36" stroke={wine} strokeWidth="4" strokeLinecap="round"/></>,
  };
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} focusable="false" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
    {medal ? <><path d="M18 38 L12 59 L23 55 L29 61 L33 43 L38 61 L44 55 L54 59 L47 38Z" fill={wine}/><circle cx="32" cy="26" r="23" fill={name === 'silver' ? accent : clay}/><text x="32" y="37" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="32" fill={cream}>{name === 'silver' ? '2' : '3'}</text></> : shapes[name] || shapes.ranking}
  </svg>;
}

export const rankIconName = rank => rank === 1 ? 'crown' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : rank <= 5 ? 'sparkle' : 'star';
