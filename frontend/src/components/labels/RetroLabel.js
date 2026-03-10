import { useRef } from "react";

const RING_COLOR = "#e0007a";
const BG_COLOR = "transparent";
const TEXT_C1 = "#cccccc"; // category (outer top arc) and date (bottom arc)
const TEXT_C2 = "#888888"; // subCategory (inner top arc)
const TEXT_POS = "#ffffff"; // position number (centre)
const FONT = "Oswald, Futura, 'Arial Narrow', Arial, sans-serif";

// Font sizes scaled to 200×200 viewBox
const FONT_SIZES = {
  25: { arc1: 7, arc2: 6, arc3: 6, pos: 24 },
  40: { arc1: 9, arc2: 8, arc3: 8, pos: 32 },
  50: { arc1: 11, arc2: 9, arc3: 9, pos: 38 },
  70: { arc1: 13, arc2: 11, arc3: 11, pos: 46 },
};

export default function RetroLabel({
  category = "",
  subCategory = "",
  position = "",
  locationDate = "",
  diameterMm = 40,
  logoSrc = "",
}) {
  const idRef = useRef(`rl${Math.random().toString(36).slice(2, 8)}`);
  const uid = idRef.current;

  const S = 200;
  const cx = 100,
    cy = 100;
  const r = 93;

  const fs = FONT_SIZES[diameterMm] || FONT_SIZES[40];

  // Arc radii — scaled from HTML reference (300px viewBox → 200px)
  const tr1 = 85; // outer arc (category)
  const tr2 = 67; // inner arc (subCategory)

  // Top arcs: sweep=1 (clockwise) → travels OVER the top, text reads right-side up
  const arc1Path = `M ${cx - tr1},${cy} A ${tr1},${tr1} 0 0,1 ${cx + tr1},${cy}`;
  const arc2Path = `M ${cx - tr2},${cy} A ${tr2},${tr2} 0 0,1 ${cx + tr2},${cy}`;
  // Bottom arc: sweep=0 (counterclockwise) + slight y offset so text sits at the bottom
  const arc3Path = `M ${cx - tr1},${cy + 3} A ${tr1},${tr1} 0 0,0 ${cx + tr1},${cy + 3}`;

  const hasSub = Boolean(subCategory);
  const hasDate = Boolean(locationDate);

  const cr = 44;
  const lSz = cr * 2;

  return (
    <svg
      width={`${diameterMm}mm`}
      height={`${diameterMm}mm`}
      viewBox={`0 0 ${S} ${S}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <path id={`${uid}-a1`} d={arc1Path} />
        <path id={`${uid}-a2`} d={arc2Path} />
        <path id={`${uid}-a3`} d={arc3Path} />
      </defs>

      {/* Dark background */}
      <circle cx={cx} cy={cy} r={r} fill={BG_COLOR} />
      {/* Pink/magenta outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={RING_COLOR}
        strokeWidth="4"
      />

      {/* Category — outer top arc */}
      {category && (
        <text
          fontSize={fs.arc1}
          fill={TEXT_C1}
          fontFamily={FONT}
          fontWeight="700"
          textAnchor="middle"
          letterSpacing="2"
        >
          <textPath href={`#${uid}-a1`} startOffset="50%">
            {category.toUpperCase()}
          </textPath>
        </text>
      )}

      {/* Sub-category (apparatus) — inner top arc */}
      {hasSub && (
        <text
          fontSize={fs.arc2}
          fill={TEXT_C2}
          fontFamily={FONT}
          fontWeight="400"
          textAnchor="middle"
          letterSpacing="4"
        >
          <textPath href={`#${uid}-a2`} startOffset="50%">
            {subCategory.toUpperCase()}
          </textPath>
        </text>
      )}

      {/* Position — centred */}

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
      {/* Date — bottom arc */}
      {hasDate && (
        <text
          fontSize={fs.arc3}
          fill={TEXT_C1}
          fontFamily={FONT}
          fontWeight="600"
          textAnchor="middle"
          letterSpacing="2"
        >
          <textPath href={`#${uid}-a3`} startOffset="50%">
            {locationDate}
          </textPath>
        </text>
      )}
    </svg>
  );
}
