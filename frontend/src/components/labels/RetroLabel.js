import { useRef } from "react";
import { CUT_COLOR } from "../../utils/labelUtils";

// 40mm diameter, viewBox 200×200 → 5 SVG units/mm
// 1pt = 0.3528mm → 1pt = 1.764 SVG units
const TITLE_FONT =
  "'Futura Condensed Extra Bold', 'Arial Narrow', Arial, sans-serif";
const BODY_FONT = "'Futura Medium', 'Arial Narrow', Arial, sans-serif";

const TITLE_SIZE = 14; // 8pt  (8 × 1.764 = 14.1)
const BODY_SIZE = 19;  // 11pt (11 × 1.764 = 19.4) — reduced from 23 per client spec
const PODIUM_SIZE = 21; // 12pt (12 × 1.764 = 21.2) — reduced from 23 per client spec
const DATE_SIZE = 11;  // 6pt  (6 × 1.764 = 10.6)
const LEADING = 24;   // 13.5pt baseline-to-baseline — reduced from 28, ensures 3 lines fit

function upper(value) {
  return String(value || "").toUpperCase();
}

export default function RetroLabel({
  raceTitleRow1 = "",
  raceTitleRow2 = "",
  categoryLines = [],
  podiumText = "",
  locationDate = "",
  hideDate = false,
  hideTitle = false,
  diameterMm = 40,
}) {
  const idRef = useRef(`cm-${Math.random().toString(36).slice(2, 8)}`);
  const uid = idRef.current;
  // Coordinate system: SVG viewBox 200×200.
  // The SVG width/height = diameterMm × mm → scales the sticker to the requested size.
  // All internal coordinates stay in viewBox units — the browser/renderer scales them.
  // At 40mm: 1 unit = 0.2 mm. At 50mm: 1 unit = 0.25 mm. At 70mm: 1 unit = 0.35 mm.
  const size = diameterMm; // actual printed diameter in mm
  const vb = 200;
  const cx = 100;
  const cy = 100;
  const radius = 88; // die-cut circle
  const outerTop = 78; // arc for race title row 1 (3.1 cm ø)
  const innerTop = 65; // arc for race title row 2 (2.6 cm ø)
  const bottomInner = 78; // arc for location/date text
  const lines = categoryLines.filter(Boolean).slice(0, 3);

  // Center category+podium block vertically between title arcs and date arc.
  // Shifts slightly up when date is visible to leave room for date text.
  const medalTextY = hideDate ? 122 : 115;

  // Block midpoint: average of first category baseline and podium baseline.
  // categoryFirst + lines.length × LEADING = podiumY
  // (categoryFirst + podiumY) / 2 = medalTextY
  const categoryFirst = medalTextY - (lines.length * LEADING) / 2;
  const podiumY = categoryFirst + lines.length * LEADING;

  return (
    <svg
      width={`${size}mm`}
      height={`${size}mm`}
      viewBox={`0 0 ${vb} ${vb}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <path
          id={`${uid}-top-1`}
          d={`M ${cx - outerTop},${cy} A ${outerTop},${outerTop} 0 0,1 ${cx + outerTop},${cy}`}
        />
        <path
          id={`${uid}-top-2`}
          d={`M ${cx - innerTop},${cy} A ${innerTop},${innerTop} 0 0,1 ${cx + innerTop},${cy}`}
        />
        <path
          id={`${uid}-bottom`}
          d={`M ${cx - bottomInner},${cy + 4} A ${bottomInner},${bottomInner} 0 0,0 ${cx + bottomInner},${cy + 4}`}
        />
      </defs>

      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="white"
        stroke={CUT_COLOR}
        strokeWidth="3"
      />

      {/* Race title row 1 — outer top arc (3.1 cm ø), 8 pt */}
      {!hideTitle && raceTitleRow1 ? (
        <text
          fontFamily={TITLE_FONT}
          fontSize={TITLE_SIZE}
          fontWeight="700"
          fill="#000"
          textAnchor="middle"
          dy="7"
          {...(raceTitleRow1.length > 28
            ? { textLength: "300", lengthAdjust: "spacingAndGlyphs" }
            : {})}
        >
          <textPath href={`#${uid}-top-1`} startOffset="50%">
            {upper(raceTitleRow1)}
          </textPath>
        </text>
      ) : null}

      {/* Race title row 2 — inner top arc (2.6 cm ø), 8 pt.
          dy=12 ensures clear separation from row 1 (no overlap). */}
      {!hideTitle && raceTitleRow2 ? (
        <text
          fontFamily={TITLE_FONT}
          fontSize={TITLE_SIZE}
          fontWeight="700"
          fill="#000"
          textAnchor="middle"
          dy="12"
          {...(raceTitleRow2.length > 22
            ? { textLength: "250", lengthAdjust: "spacingAndGlyphs" }
            : {})}
        >
          <textPath href={`#${uid}-top-2`} startOffset="50%">
            {upper(raceTitleRow2)}
          </textPath>
        </text>
      ) : null}

      {lines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x={cx}
          y={categoryFirst + index * LEADING}
          fontFamily={BODY_FONT}
          fontSize={BODY_SIZE}
          fill="#000"
          textAnchor="middle"
        >
          {upper(line)}
        </text>
      ))}

      <text
        x={cx}
        y={podiumY}
        fontFamily={TITLE_FONT}
        fontSize={PODIUM_SIZE}
        fontWeight="700"
        fill="#000"
        textAnchor="middle"
      >
        {upper(podiumText)}
      </text>

      {/* Location / date — inside bottom arc, 6 pt, italic */}
      {!hideDate && locationDate ? (
        <text
          fontFamily={TITLE_FONT}
          fontSize={DATE_SIZE}
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
