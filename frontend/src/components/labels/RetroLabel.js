import { useRef } from "react";
import { CUT_COLOR } from "../../utils/labelUtils";

// 40mm diameter, viewBox 200×200 → 5 SVG units/mm
// 1pt = 0.3528mm → 1pt = 1.764 SVG units
const TITLE_FONT =
  "'Futura Condensed Extra Bold', 'Arial Narrow', Arial, sans-serif";
// Futura Medium Condensed for category body lines (closer to the reference)
const BODY_FONT =
  "'Futura Medium Condensed', 'Futura Medium', 'Arial Narrow', Arial, sans-serif";

const TITLE_SIZE = 14;  // 8pt
const BODY_SIZE  = 19;  // 11pt
const PODIUM_SIZE = 21; // 12pt
const DATE_SIZE  = 11;  // 6pt
const LEADING    = 20;  // tighter line spacing between body lines (was 24)

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

  const size = diameterMm;
  const vb   = 200;
  const cx   = 100;
  const cy   = 100;
  const radius      = 88; // die-cut circle
  const outerTop    = 78; // arc for race title row 1
  const innerTop    = 65; // arc for race title row 2
  const bottomInner = 78; // arc for location/date

  const lines = categoryLines.filter(Boolean).slice(0, 3);
  const lineCount = lines.length; // 0, 1, 2 or 3

  // Vertical centre of the content block.
  // When Row C is absent (lineCount < 3) the whole block shifts upward so it
  // sits closer to the medal centre rather than floating low.
  //
  // Reference positions (viewBox units, approx):
  //   Title arcs end  ≈ y 38   (cy - outerTop + TITLE_SIZE + dy)
  //   Date arc starts ≈ y 173  (cy + bottomInner - DATE_SIZE)
  //   Usable centre   ≈ y 105
  //
  // With 3 lines the block needs  3×LEADING + PODIUM_SIZE ≈ 81 units.
  // With 2 lines                                           ≈ 61 units → shift up 10.
  // With 1 line                                            ≈ 41 units → shift up 20.
  // With 0 lines (podium only)                             ≈ 21 units → shift up 30.
  const centerY = hideDate ? 110 : 105;
  const SHIFT_PER_MISSING_LINE = 10;
  const missingLines = 3 - lineCount;
  const medalTextY = centerY - missingLines * SHIFT_PER_MISSING_LINE;

  // Block: categoryFirst … categoryFirst + (lineCount-1)*LEADING … podiumY
  // Midpoint = medalTextY
  // (categoryFirst + podiumY) / 2 = medalTextY
  // podiumY = categoryFirst + lineCount * LEADING
  // → categoryFirst = medalTextY - lineCount * LEADING / 2
  const categoryFirst = medalTextY - (lineCount * LEADING) / 2;
  const podiumY       = categoryFirst + lineCount * LEADING;

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

      <circle cx={cx} cy={cy} r={radius} fill="white" stroke={CUT_COLOR} strokeWidth="3" />

      {/* Race title row 1 — outer top arc, dy=7 pushes text inside circle */}
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

      {/* Race title row 2 — inner top arc, dy=8 keeps it close to row 1 */}
      {!hideTitle && raceTitleRow2 ? (
        <text
          fontFamily={TITLE_FONT}
          fontSize={TITLE_SIZE}
          fontWeight="700"
          fill="#000"
          textAnchor="middle"
          dy="8"
          {...(raceTitleRow2.length > 22
            ? { textLength: "250", lengthAdjust: "spacingAndGlyphs" }
            : {})}
        >
          <textPath href={`#${uid}-top-2`} startOffset="50%">
            {upper(raceTitleRow2)}
          </textPath>
        </text>
      ) : null}

      {/* Category body lines (Row A / B / C) — Futura Medium Condensed, tighter leading */}
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

      {/* Podium text */}
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
