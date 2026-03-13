import { useRef } from "react";

const RING_COLOR = "#CC007A";
const FONT = "Futura, 'Arial Narrow', 'Trebuchet MS', Arial, sans-serif";

const FONT_SIZES = {
  25: { top: 8, bot: 7 },
  40: { top: 11, bot: 9 },
  50: { top: 13, bot: 11 },
  70: { top: 15, bot: 13 },
};

function splitLine(text, maxChars = 20) {
  if (!text || text.length <= maxChars) return [text || "", ""];
  const space = text.lastIndexOf(" ", maxChars + 4);
  if (space > 4) return [text.slice(0, space), text.slice(space + 1)];
  return [text.slice(0, maxChars), text.slice(maxChars)];
}

export default function MedalLabel({
  topText = "",
  bottomText = "",
  logoSrc = "",
  diameterMm = 40,
  textPosition = "inside", // 'inside' = curved text | 'outside' = text above/below circle
}) {
  const idRef = useRef(`m${Math.random().toString(36).slice(2, 8)}`);
  const uid = idRef.current;

  // ─── OUTSIDE LAYOUT: participation medal with text above/below circle ───
  if (textPosition === "outside") {
    const VB_W = 200;
    const VB_H = 320;
    const cx = 100,
      cy = 165; // circle center shifted down to leave room for top text
    const r = 93;
    const cr = 80;
    const lSz = cr * 2;

    const phyH = ((diameterMm * VB_H) / VB_W).toFixed(1);

    const [line1, line2] = splitLine((topText || "").toUpperCase(), 20);
    const hasLine2 = Boolean(line2);
    const fsTop = 21;
    const fsBot = 17;

    // Top text y positions
    const yLine1 = hasLine2 ? 24 : 36;
    const yLine2 = 50;
    // Bottom text y: below circle (cy + r = 258), centered in remaining space to 320
    const yBot = 289;

    return (
      <svg
        width={`${diameterMm}mm`}
        height={`${phyH}mm`}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <clipPath id={`${uid}-c`}>
            <circle cx={cx} cy={cy} r={cr} />
          </clipPath>
        </defs>

        {/* Top text – competition/event name */}
        {topText && (
          <text
            x={cx}
            y={yLine1}
            fontSize={fsTop}
            fontFamily={FONT}
            fontWeight="bold"
            textAnchor="middle"
            fill="black"
          >
            {line1}
          </text>
        )}
        {hasLine2 && (
          <text
            x={cx}
            y={yLine2}
            fontSize={fsTop}
            fontFamily={FONT}
            fontWeight="bold"
            textAnchor="middle"
            fill="black"
          >
            {line2}
          </text>
        )}

        {/* Medal circle – single ring (cutting line) */}
        <circle cx={cx} cy={cy} r={r} fill="white" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={RING_COLOR}
          strokeWidth="3.5"
        />

        {/* Logo inside circle */}
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

        {/* Bottom text – date / location */}
        {bottomText && (
          <text
            x={cx}
            y={yBot}
            fontSize={fsBot}
            fontFamily={FONT}
            fontWeight="normal"
            textAnchor="middle"
            fill="black"
          >
            {bottomText.toUpperCase()}
          </text>
        )}
      </svg>
    );
  }

  // ─── INSIDE LAYOUT: curved text (podio medal fronts) ───
  const S = 200;
  const cx = 100,
    cy = 100;
  const r = 93;
  const tr = 85;
  const cr = 74;
  const lSz = cr * 2;
  const fs = FONT_SIZES[diameterMm] || FONT_SIZES[40];

  const topPath = `M ${cx - tr},${cy} A ${tr},${tr} 0 0,1 ${cx + tr},${cy}`;
  const botPath = `M ${cx - tr},${cy + 3} A ${tr},${tr} 0 0,0 ${cx + tr},${cy + 3}`;

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

      {/* Single ring – cutting line only */}
      <circle cx={cx} cy={cy} r={r} fill="white" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={RING_COLOR}
        strokeWidth="3.5"
      />

      {/* Logo */}
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
          dy={"2"}
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
