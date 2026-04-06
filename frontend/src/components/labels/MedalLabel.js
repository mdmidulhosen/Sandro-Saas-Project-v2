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
  // Outer title arc:  1.9 cm ø  → radius = 9.5 mm = 76 SVG units (clockwise = over top)
  // Inner title arc:  1.5 cm ø  → radius = 7.5 mm = 60 SVG units
  // Bottom text arc:  same as outer → 76 SVG units (counter-clockwise = under bottom)
  const size = 25;
  const vb = 200;
  const cx = 100;
  const cy = 100;
  const radius = 88; // die-cut circle
  const outerTop = 76; // arc for race title row 1 (1.9 cm ø)
  const innerTop = 60; // arc for race title row 2 (1.5 cm ø)
  const bottomArc = 76; // arc for location/date text

  // Logo box: 1.25 cm × 1.25 cm = 10mm × 10mm = 80 SVG units square, centered
  const logoSize = 80;
  const logoOffset = (vb - logoSize) / 2; // = 60

  return (
    <svg
      width={`${size}mm`}
      height={`${size}mm`}
      viewBox={`0 0 ${vb} ${vb}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Row 1 title: clockwise arc over the top, radius 76 */}
        <path
          id={`${uid}-top-1`}
          d={`M ${cx - outerTop},${cy} A ${outerTop},${outerTop} 0 0,1 ${cx + outerTop},${cy}`}
        />
        {/* Row 2 title: clockwise arc over the top, radius 60 */}
        <path
          id={`${uid}-top-2`}
          d={`M ${cx - innerTop},${cy} A ${innerTop},${innerTop} 0 0,1 ${cx + innerTop},${cy}`}
        />
        {/* Location/date: counter-clockwise arc under the bottom, radius 76 */}
        <path
          id={`${uid}-bottom`}
          d={`M ${cx - bottomArc},${cy + 3} A ${bottomArc},${bottomArc} 0 0,0 ${cx + bottomArc},${cy + 3}`}
        />
        {/* Logo clip: square 1.25cm × 1.25cm centered */}
        <clipPath id={`${uid}-logo`}>
          <rect
            x={logoOffset}
            y={logoOffset}
            width={logoSize}
            height={logoSize}
          />
        </clipPath>
      </defs>

      {/* Die-cut circle — pink stroke = #e6007e */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="white"
        stroke={CUT_COLOR}
        strokeWidth="3"
      />

      {/* Logo — centered square 1.25×1.25 cm */}
      {logoSrc ? (
        <image
          href={logoSrc}
          x={logoOffset}
          y={logoOffset}
          width={logoSize}
          height={logoSize}
          preserveAspectRatio="xMidYMid meet"
          clipPath={`url(#${uid}-logo)`}
        />
      ) : null}

      {/* Race title row 1 — outer top arc, dy pushes text inside circle */}
      {raceTitleRow1 ? (
        <text
          fontFamily={FONT_FAMILY}
          fontSize="17"
          fontWeight="700"
          fill="#000"
          textAnchor="middle"
          dy="8"
          {...(raceTitleRow1.length > 22
            ? { textLength: "230", lengthAdjust: "spacingAndGlyphs" }
            : {})}
        >
          <textPath href={`#${uid}-top-1`} startOffset="50%">
            {upper(raceTitleRow1)}
          </textPath>
        </text>
      ) : null}

      {/* Race title row 2 — inner top arc, dy=14 to clear row 1 without overlap */}
      {raceTitleRow2 ? (
        <text
          fontFamily={FONT_FAMILY}
          fontSize="17"
          fontWeight="700"
          fill="#000"
          textAnchor="middle"
          dy="14"
          {...(raceTitleRow2.length > 18
            ? { textLength: "190", lengthAdjust: "spacingAndGlyphs" }
            : {})}
        >
          <textPath href={`#${uid}-top-2`} startOffset="50%">
            {upper(raceTitleRow2)}
          </textPath>
        </text>
      ) : null}

      {/* Location / date — inside bottom arc, italic to match reference */}
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
