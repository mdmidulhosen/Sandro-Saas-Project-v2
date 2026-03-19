import { CUT_COLOR } from "../../utils/labelUtils";

// RectLabel uses proportional scaling so every sticker size (5.5, 5.0, 4.5 cm)
// looks visually identical. All spec values below are defined at the BASE_WIDTH
// reference size; they scale linearly with the actual sticker width.
const BASE_WIDTH = 55; // mm — reference width (rank-1 default: 5.5 cm)

// Spec font sizes at BASE_WIDTH (1pt = 0.3528mm)
const PT = 0.3528;
const TITLE_SIZE_BASE = +(8 * PT).toFixed(3); // 8pt  at 5.5 cm
const BODY_SIZE_BASE = +(11 * PT).toFixed(3); // 11pt at 5.5 cm
const PODIUM_SIZE_BASE = +(13 * PT).toFixed(3); // 13pt at 5.5 cm
const DATE_SIZE_BASE = +(6 * PT).toFixed(3); // 6pt  at 5.5 cm
const ADVANCE_BASE = +(13 * PT).toFixed(3); // 13pt baseline-to-baseline advance
const LOGO_SIZE_BASE = 12; // mm logo box at 5.5 cm
const MARGIN_BASE = 4; // mm left margin at 5.5 cm
const RIGHT_MARGIN_BASE = 2; // mm right margin at 5.5 cm

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

function getX(align, width, margin, rightMargin) {
  if (align === "left") return margin;
  if (align === "right") return width - rightMargin;
  return width / 2;
}

export default function RectLabel({
  raceTitleRow1 = "",
  raceTitleRow2 = "",
  categoryLines = [],
  podiumText = "",
  locationDate = "",
  logoSrc = "",
  align = "right",
  logoAlign = "left",
  widthCm = 5.5,
  heightCm = 2.3,
  titleHidden = false,
}) {
  const width = widthCm * 10;
  const height = heightCm * 10;

  // Scale all dimensions proportionally so every rank looks visually identical
  const scale = width / BASE_WIDTH;
  const TITLE_SIZE = +(TITLE_SIZE_BASE * scale).toFixed(2);
  const BODY_SIZE = +(BODY_SIZE_BASE * scale).toFixed(2);
  const PODIUM_SIZE = +(PODIUM_SIZE_BASE * scale).toFixed(2);
  const DATE_SIZE = +(DATE_SIZE_BASE * scale).toFixed(2);
  const ADVANCE = +(ADVANCE_BASE * scale).toFixed(2);
  const LOGO_SIZE = +(LOGO_SIZE_BASE * scale).toFixed(2);
  const MARGIN = +(MARGIN_BASE * scale).toFixed(2);
  const RIGHT_MARGIN = +(RIGHT_MARGIN_BASE * scale).toFixed(2);

  const anchor = getAnchor(align);
  const textX = getX(align, width, MARGIN, RIGHT_MARGIN);
  const logoX = logoAlign === "right" ? width - MARGIN - LOGO_SIZE : MARGIN;
  const contentLines = categoryLines.filter(Boolean).slice(0, 2);

  // Build text block — title/podium forced uppercase; category/date preserve case
  const textBlock = [];
  if (!titleHidden && raceTitleRow1)
    textBlock.push({
      text: upper(raceTitleRow1),
      font: TITLE_FONT,
      size: TITLE_SIZE,
      weight: 700,
    });
  if (!titleHidden && raceTitleRow2)
    textBlock.push({
      text: upper(raceTitleRow2),
      font: TITLE_FONT,
      size: TITLE_SIZE,
      weight: 700,
    });
  contentLines.forEach((line) => {
    textBlock.push({
      text: line,
      font: BODY_FONT,
      size: BODY_SIZE,
      weight: 400,
    });
  });
  if (podiumText)
    textBlock.push({
      text: upper(podiumText),
      font: TITLE_FONT,
      size: PODIUM_SIZE,
      weight: 700,
    });
  if (locationDate)
    textBlock.push({
      text: locationDate,
      font: TITLE_FONT,
      size: DATE_SIZE,
      weight: 700,
      italic: true,
    });

  if (textBlock.length === 0) {
    return (
      <svg
        width={`${width}mm`}
        height={`${height}mm`}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="0.5"
          y="0.5"
          width={width - 1}
          height={height - 1}
          rx="1"
          fill="white"
          stroke={CUT_COLOR}
          strokeWidth="1"
        />
      </svg>
    );
  }

  // Total visual span and starting Y for vertical centering
  const totalHeight = textBlock[0].size + (textBlock.length - 1) * ADVANCE;
  let y = (height - totalHeight) / 2 + textBlock[0].size;

  return (
    <svg
      width={`${width}mm`}
      height={`${height}mm`}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Die-cut border: #e6007e, 1pt, center-aligned stroke */}
      <rect
        x="0.5"
        y="0.5"
        width={width - 1}
        height={height - 1}
        rx="1"
        fill="white"
        stroke={CUT_COLOR}
        strokeWidth="0.5"
      />

      {/* Logo — bottom-left (or bottom-right), margin from die-cut, max on longest side */}
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
        y += ADVANCE;
        return (
          <text
            key={`${index}-${line.text}`}
            x={textX + 20}
            y={currentY}
            textAnchor={"end"}
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
