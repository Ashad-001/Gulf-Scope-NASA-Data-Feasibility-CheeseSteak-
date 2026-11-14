'use client';

import { motion, useReducedMotion } from 'motion/react';

export function Contours() {
  const reduced = useReducedMotion();
  return <svg className="contours" viewBox="0 0 900 620" fill="none" aria-hidden="true">
    {[0, 1, 2, 3, 4, 5].map(i => <motion.path key={i}
      d={`M ${315 - i * 30} 620 C ${480 - i * 30} 485, ${310 - i * 23} 380, ${570 - i * 12} 295 S ${720 + i * 14} ${135 - i * 10}, 900 ${95 - i * 20}`}
      stroke="currentColor" strokeWidth="1" initial={false}
      animate={reduced ? { pathLength: 1, opacity: 0.18 } : { pathLength: [0.05, 1, 1], opacity: [0.14, 0.38, 0.14] }}
      transition={reduced ? { duration: 0 } : { duration: 8, delay: i * 0.16, repeat: Infinity, repeatDelay: 2 }} />)}
    <circle cx="567" cy="294" r="4" fill="currentColor" /><circle cx="567" cy="294" r="15" stroke="currentColor" opacity=".5" />
    <path d="M 587 294 H 676" stroke="currentColor" opacity=".55"/>
    <text x="686" y="299" fill="currentColor" fontSize="12" letterSpacing="3">BAHRAIN</text>
  </svg>;
}
