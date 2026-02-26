import React from 'react';

/**
 * FairSlot logo — dark rounded square with calendar grid,
 * one glowing blue cell, and a subtle ring.
 */
export default function Logo({ size = 32, showText = false, className = '', textColor = '#1e293b', style = {} }) {

  return (
    <span
      className={`fairslot-logo ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ flexShrink: 0 }}
      >
        <defs>
          {/* Glow filter for the highlighted cell */}
          <filter id="fs-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Background gradient */}
          <linearGradient id="fs-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          {/* Accent gradient for the glowing cell */}
          <linearGradient id="fs-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Dark rounded square background */}
        <rect width="100" height="100" rx="22" fill="url(#fs-bg)" />
        <rect width="100" height="100" rx="22" fill="none" stroke="rgba(203, 213, 225, 0.45)" strokeWidth="1.8" />

        {/* Subtle circular ring */}
        {/* <circle cx="50" cy="50" r="36" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" /> */}

        {/* 3×3 calendar grid — 17px cells, 5px gaps, centered in 100×100 */}
        {/* Row 1 */}
        <rect x="19" y="19" width="17" height="17" rx="3.5" fill="rgb(255, 255, 255)" />
        <rect x="41" y="19" width="17" height="17" rx="3.5" fill="rgb(255, 255, 255)" />
        {/* <rect x="63" y="19" width="17" height="17" rx="3.5" fill="rgb(255, 255, 255)" /> */}
        <rect x="63" y="19" width="17" height="17" rx="3.5" fill="#00ff73" filter="url(#fs-glow)" />
        {/* Row 2 */}
        <rect x="19" y="41" width="17" height="17" rx="3.5" fill="rgb(255, 255, 255)" />
        {/* <rect x="41" y="41" width="17" height="17" rx="3.5" fill="rgb(255, 255, 255)" /> */}
        <rect x="41" y="41" width="17" height="17" rx="3.5" fill="#ff0040" filter="url(#fs-glow)" />
        <rect x="63" y="41" width="17" height="17" rx="3.5" fill="rgb(255, 255, 255)" />
        {/* Row 3 */}
        <rect x="19" y="63" width="17" height="17" rx="3.5" fill="rgb(255, 255, 255)" />
        <rect x="41" y="63" width="17" height="17" rx="3.5" fill="rgb(255, 255, 255)" />
        <rect x="63" y="63" width="17" height="17" rx="3.5" fill="rgb(255, 255, 255)" />
      </svg>

      {showText && (
        <span style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: size * 0.65,
          letterSpacing: '-0.02em',
          color: textColor,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>
          FairSlot
        </span>
      )}
    </span>
  );
}
