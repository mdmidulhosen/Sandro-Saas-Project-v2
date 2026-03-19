import { CUT_COLOR } from "../../utils/labelUtils";

// RectLabel SVG coordinate system: 1 unit = 1mm (viewBox matches mm dimensions)
// Font sizes converted from pt: 1pt = 0.3528mm
const PT = 0.3528;
const TITLE_SIZE  = +(8  * PT).toFixed(2); // 8pt  = 2.82mm
const BODY_SIZE   = +(11 * PT).toFixed(2); // 11pt = 3.88mm
const PODIUM_SIZE = +(13 * PT).toFixed(2); // 13pt = 4.59mm
const DATE_SIZE   = +(6  * PT).toFixed(2); // 6pt  = 2.12mm
// Baseline-to-baseline advance between elements: 13pt = 4.59mm (spec)
const ELEMENT_ADVANCE = +(13 * PT).toFixed(2);
// Logo size: ~50% of sticker height, constrained by preserveAspectRatio="xMidYMid meet"
const LOGO_SIZE = 12; // mm
// Margin from die-cut line for non-centered alignments
const MARGIN = 4; // mm

const TITLE_FONT =
  "'Futura Condensed Extra Bold', 'Arial Narrow', Arial, sans-serif";
const BODY_FONT = "'Futura Medium', 'Arial Narrow', Arial, sans-serif";

function upper(value) {
  return String(value || "").toUpperCase();
}

function getAnchor(align) {
  if (align === "left") return "start";
  if (align === "right") return "end";
  return "middle";
}

function getX(align, width) {
  if (align === "left") return MARGIN;
  if (align === "right") return width - MARGIN;
  return width / 2;
}

export default function RectLabel({
  raceTitleRow1 = "",
  raceTitleRow2 = "",
  categoryLines = [],
  podiumText = "",
  locationDate = "",
  logoSrc = "",
  align = "center",
  logoAlign = "left",
  widthCm = 5.5,
  heightCm = 2.3,
  titleHidden = false,
}) {
  const width = widthCm * 10;
  const height = heightCm * 10;
  const anchor = getAnchor(align);
  const textX = getX(align, width);
  const logoX = logoAlign === "right" ? width - MARGIN - LOGO_SIZE : MARGIN;
  const contentLines = categoryLines.filter(Boolean).slice(0, 2);

  // Build text block — each entry controls uppercase and italic independently
  // title/podium: uppercase per spec; category/date: preserve user case
  const textBlock = [];
  if (!titleHidden && raceTitleRow1)
    textBlock.push({ text: upper(raceTitleRow1), font: TITLE_FONT, size: TITLE_SIZE, weight: 700 });
  if (!titleHidden && raceTitleRow2)
    textBlock.push({ text: upper(raceTitleRow2), font: TITLE_FONT, size: TITLE_SIZE, weight: 700 });
  contentLines.forEach((line) => {
    textBlock.push({ text: line, font: BODY_FONT, size: BODY_SIZE, weight: 400 });
  });
  if (podiumText)
    textBlock.push({ text: upper(podiumText), font: TITLE_FONT, size: PODIUM_SIZE, weight: 700 });
  if (locationDate)
    textBlock.push({ text: locationDate, font: TITLE_FONT, size: DATE_SIZE, weight: 700, italic: true });

  if (textBlock.length === 0) {
    return (
      <svg width={`${width}mm`} height={`${height}mm`} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width={width - 1} height={height - 1} rx="1" fill="white" stroke={CUT_COLOR} strokeWidth="1" />
      </svg>
    );
  }

  // Total visual span: top of first char to baseline of last char
  const totalHeight = textBlock[0].size + (textBlock.length - 1) * ELEMENT_ADVANCE;
  let y = (height - totalHeight) / 2 + textBlock[0].size;

  return (
    <svg
      width={`${width}mm`}
      height={`${height}mm`}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Die-cut border: #e6007e, 1pt, center-aligned */}
      <rect x="0.5" y="0.5" width={width - 1} height={height - 1} rx="1" fill="white" stroke={CUT_COLOR} strokeWidth="1" />

      {/* Logo — bottom-left (or bottom-right), margin from die-cut, max size on longest side */}
      {logoSrc ? (
        <image
          href={logoSrc}
          x={logoX}
          y={height - MARGIN - LOGO_SIZE}
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}

      {/* Text block — vertically centered, aligned per align prop */}
      {textBlock.map((line, index) => {
        const currentY = y;
        y += ELEMENT_ADVANCE;
        return (
          <text
            key={`${line.text}-${index}`}
            x={textX}
            y={currentY}
            textAnchor={anchor}
            fontFamily={line.font}
            fontSize={line.size}
            fontWeight={line.weight}
            fontStyle={line.italic ? "italic" : "normal"}
            fill="#000"
          >
            {line.text}
          </text>
        );
      })}
    </svg>
  );
}
