import { useRef } from 'react';

const RING_COLOR = '#CC007A';
const FONT = "Futura, 'Arial Narrow', 'Trebuchet MS', Arial, sans-serif";

// Font sizes (in viewBox units, viewBox = 200×200)
const FONT_SIZES = {
  25: { top: 8,  bot: 7  },
  40: { top: 11, bot: 9  },
  50: { top: 13, bot: 11 },
  70: { top: 15, bot: 13 }
};

export default function MedalLabel({ topText = '', bottomText = '', logoSrc = '', diameterMm = 40 }) {
  const idRef = useRef(`m${Math.random().toString(36).slice(2, 8)}`);
  const uid = idRef.current;

  const S   = 200;          // viewBox size
  const cx  = 100, cy = 100;
  const r   = 93;           // outer ring radius
  const ri  = 77;           // inner ring radius
  const tr  = 85;           // text arc radius (between rings)
  const cr  = 74;           // clip radius for logo
  const lSz = cr * 2;       // logo fills inner circle

  const fs = FONT_SIZES[diameterMm] || FONT_SIZES[40];

  // Top arc: counterclockwise from left equator to right equator → over the top
  const topPath = `M ${cx - tr},${cy} A ${tr},${tr} 0 0,0 ${cx + tr},${cy}`;
  // Bottom arc: clockwise from left equator to right equator → through the bottom
  const botPath = `M ${cx - tr},${cy} A ${tr},${tr} 0 0,1 ${cx + tr},${cy}`;

  return (
    <svg
      width={`${diameterMm}mm`}
      height={`${diameterMm}mm`}
      viewBox={`0 0 ${S} ${S}`}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <path id={`${uid}-t`} d={topPath} />
        <path id={`${uid}-b`} d={botPath} />
        <clipPath id={`${uid}-c`}>
          <circle cx={cx} cy={cy} r={cr} />
        </clipPath>
      </defs>

      {/* White background */}
      <circle cx={cx} cy={cy} r={r} fill="white" />

      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={RING_COLOR} strokeWidth="3.5" />

      {/* Inner decorative ring */}
      <circle cx={cx} cy={cy} r={ri} fill="none" stroke={RING_COLOR} strokeWidth="1.5" />

      {/* Logo – centred, clipped to inner circle */}
      {logoSrc && (
        <image
          href={logoSrc}
          x={cx - cr}
          y={cy - cr}
          width={lSz}
          height={lSz}
          preserveAspectRatio="xMidYMid meet"
          clipPath={`url(#${uid}-c)`}
        />
      )}

      {/* Top curved text */}
      {topText && (
        <text
          fontSize={fs.top}
          fill="black"
          fontFamily={FONT}
          fontWeight="bold"
          textAnchor="middle"
        >
          <textPath href={`#${uid}-t`} startOffset="50%">
            {topText.toUpperCase()}
          </textPath>
        </text>
      )}

      {/* Bottom curved text */}
      {bottomText && (
        <text
          fontSize={fs.bot}
          fill="black"
          fontFamily={FONT}
          fontWeight="bold"
          textAnchor="middle"
        >
          <textPath href={`#${uid}-b`} startOffset="50%">
            {bottomText.toUpperCase()}
          </textPath>
        </text>
      )}
    </svg>
  );
}
