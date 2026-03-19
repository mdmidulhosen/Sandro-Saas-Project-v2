import { useRef } from "react";
import { CUT_COLOR } from "../../utils/labelUtils";

const FONT_FAMILY =
  "'Futura Condensed Extra Bold', 'Arial Narrow', Arial, sans-serif";

function upper(value) {
  return String(value || "").toUpperCase();
}

export default function MedalLabel({
  raceTitleRow1 = "",
  raceTitleRow2 = "",
  locationDate = "",
  logoSrc = "",
}) {
  const idRef = useRef(`pm-${Math.random().toString(36).slice(2, 8)}`);
  const uid = idRef.current;

  // Coordinate system: SVG is 25mm × 25mm, viewBox 200×200 → 1 unit = 0.125 mm
  // Sticker = 2.5 cm total (includes ~1.5 mm bleed each side)
  // Die-cut diameter: 2.2 cm = 22 mm → radius = 11 mm = 88 SVG units
  // Outer title arc:  1.9 cm ø  → radius = 9.5 mm = 76 SVG units
  // Inner title arc:  1.5 cm ø  → radius = 7.5 mm = 60 SVG units
  // Bottom text arc:  same as outer → 76 SVG units
  const size = 25;
  const vb = 200;
  const cx = 100;
  const cy = 100;
  const radius = 88; // die-cut circle
  const outerTop = 76; // arc for race title row 1 (1.9 cm ø)
  const innerTop = 60; // arc for race title row 2 (1.5 cm ø)
  const bottomArc = 76; // arc for location/date text

  return (
    <svg
      width={`${size}mm`}
      height={`${size}mm`}
      viewBox={`0 0 ${vb} ${vb}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Row 1 title: arc over the top, radius 76 (1.9 cm ø) */}
        <path
          id={`${uid}-top-1`}
          d={`M ${cx - outerTop},${cy} A ${outerTop},${outerTop} 0 0,1 ${cx + outerTop},${cy}`}
        />
        {/* Row 2 title: inner arc over the top, radius 60 (1.5 cm ø) */}
        <path
          id={`${uid}-top-2`}
          d={`M ${cx - innerTop},${cy} A ${innerTop},${innerTop} 0 0,1 ${cx + innerTop},${cy}`}
        />
        {/* Location/date: arc inside bottom of sticker, radius 76 */}
        <path
          id={`${uid}-bottom`}
          d={`M ${cx - bottomArc},${cy + 3} A ${bottomArc},${bottomArc} 0 0,0 ${cx + bottomArc},${cy + 3}`}
        />
        {/* Logo clip: circle just inside the inner title arc */}
        <clipPath id={`${uid}-logo`}>
          <circle cx={cx} cy={cy} r="50" />
        </clipPath>
      </defs>

      {/* Die-cut circle — pink stroke = #e6007e, 1 pt */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="white"
        stroke={CUT_COLOR}
        strokeWidth="3"
      />

      {/* Logo — centered, max size constrained to logo clip circle */}
      {logoSrc ? (
        <image
          href={logoSrc}
          x="50"
          y="50"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid meet"
          clipPath={`url(#${uid}-logo)`}
        />
      ) : null}

      {/* Race title row 1 — outer arc, 6 pt, Futura Bold Condensed */}
      {raceTitleRow1 ? (
        <text
          fontFamily={FONT_FAMILY}
          fontSize="17"
          fontWeight="700"
          fill="#000"
          textAnchor="middle"
          dy="7"
        >
          <textPath href={`#${uid}-top-1`} startOffset="50%">
            {upper(raceTitleRow1)}
          </textPath>
        </text>
      ) : null}

      {/* Race title row 2 — inner arc, 6 pt (only when row 1 > 35 chars) */}
      {raceTitleRow2 ? (
        <text
          fontFamily={FONT_FAMILY}
          fontSize="17"
          fontWeight="700"
          fill="#000"
          textAnchor="middle"
        >
          <textPath href={`#${uid}-top-2`} startOffset="50%">
            {upper(raceTitleRow2)}
          </textPath>
        </text>
      ) : null}

      {/* Location / date — inside bottom arc, 6 pt, italic + mixed case to match reference */}
      {/* textLength compresses text when > 30 chars to avoid overflow */}
      {locationDate ? (
        <text
          fontFamily={FONT_FAMILY}
          fontSize="17"
          fontWeight="700"
          fontStyle="italic"
          fill="#000"
          textAnchor="middle"
          dy="-3"
          {...(locationDate.length > 30
            ? { textLength: "240", lengthAdjust: "spacingAndGlyphs" }
            : {})}
        >
          <textPath href={`#${uid}-bottom`} startOffset="50%">
            {locationDate}
          </textPath>
        </text>
      ) : null}
    </svg>
  );
}
