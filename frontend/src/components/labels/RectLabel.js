// const BORDER = "#CC007A";
// const FONT = "Futura, 'Arial Narrow', 'Trebuchet MS', Arial, sans-serif";

// // Only compress text when it would overflow the column — never stretch short text
// function compress(text, fontSize, maxW) {
//   const natural = text.length * fontSize * 0.58;
//   return natural > maxW
//     ? { textLength: maxW, lengthAdjust: "spacingAndGlyphs" }
//     : {};
// }

// // Split competition name near the midpoint at a word boundary
// function splitName(text) {
//   const up = text.toUpperCase();
//   if (up.length <= 22) return [up, ""];
//   const target = Math.round(up.length * 0.52);
//   let idx = up.lastIndexOf(" ", target);
//   if (idx < target - 12) idx = up.indexOf(" ", target);
//   if (idx <= 0) return [up, ""];
//   return [up.slice(0, idx), up.slice(idx + 1)];
// }

// export default function RectLabel({
//   competitionName = "",
//   category = "",
//   position = "",
//   locationDate = "",
//   logoSrc = "",
//   widthCm = 9.0,
// }) {
//   const w = widthCm * 10; // viewBox units = mm
//   const h = 44; // 4.4 cm — fits 5 lines without overlap

//   const logoCol = logoSrc ? Math.min(w * 0.25, 26) : 0;
//   const tx = w - 3; // right edge of text
//   const tl = tx - logoCol - 2; // available text column width

//   const [name1, name2] = splitName(competitionName);

//   // Hardcoded baselines verified to not overlap:
//   // SVG y = text baseline; cap-height ≈ fontSize × 0.75, descenders ≈ × 0.25
//   const yN1 = 7.5;
//   const yN2 = 14.0; // used only when name2 exists
//   const yCat = name2 ? 22.0 : 17.0;
//   const yPos = name2 ? 33.5 : 30.0;
//   const yDate = name2 ? 40.5 : 37.5;

//   return (
//     <svg
//       width={`${widthCm}cm`}
//       height="4.4cm"
//       viewBox={`0 0 ${w} ${h}`}
//       xmlns="http://www.w3.org/2000/svg"
//       xmlnsXlink="http://www.w3.org/1999/xlink"
//       overflow="hidden"
//     >
//       {/* White background + pink border */}
//       <rect
//         x="0.75"
//         y="0.75"
//         width={w - 1.5}
//         height={h - 1.5}
//         fill="white"
//         stroke={BORDER}
//         strokeWidth="1.5"
//         rx="0.5"
//       />

//       {/* Logo — fills the left column */}
//       {logoSrc && (
//         <>
//           {/* <line x1={logoCol} y1="2.5" x2={logoCol} y2={h - 2.5}
//             stroke={BORDER} strokeWidth="0.5" strokeDasharray="1.5,1.5" /> */}
//           <image
//             href={logoSrc}
//             x="2.5"
//             y="2.5"
//             width={logoCol - 3.5}
//             height={h - 5}
//             preserveAspectRatio="xMidYMid meet"
//           />
//         </>
//       )}

//       {/* Competition name – line 1 */}
//       <text
//         x={tx}
//         y={yN1}
//         textAnchor="end"
//         fontSize="5"
//         fontWeight="bold"
//         fontFamily={activeFont}
//         fill="black"
//         {...compress(name1, 5, tl)}
//       >
//         {name1}
//       </text>

//       {/* Competition name – line 2 (long names only) */}
//       {name2 && (
//         <text
//           x={tx}
//           y={yN2}
//           textAnchor="end"
//           fontSize="5"
//           fontWeight="bold"
//           fontFamily={activeFont}
//           fill="black"
//           {...compress(name2, 5, tl)}
//         >
//           {name2}
//         </text>
//       )}

//       {/* Category */}
//       <text
//         x={tx}
//         y={yCat}
//         textAnchor="end"
//         fontSize="6.5"
//         fontWeight="700"
//         fontFamily={activeFont}
//         fill="black"
//         {...compress(category, 6.5, tl)}
//       >
//         {category}
//       </text>

//       {/* Position — largest text on the label */}
//       <text
//         x={tx}
//         y={yPos}
//         textAnchor="end"
//         fontSize="12"
//         fontWeight="900"
//         fontFamily={activeFont}
//         fill="black"
//         {...compress(position.toUpperCase(), 12, tl)}
//       >
//         {position.toUpperCase()}
//       </text>

//       {/* Date — small, bottom right */}
//       <text
//         x={tx}
//         y={yDate}
//         textAnchor="end"
//         fontSize="3.5"
//         fontFamily={activeFont}
//         fill="black"
//       >
//         {locationDate}
//       </text>
//     </svg>
//   );
// }

const BORDER = "#CC007A";
const FONT = "Futura, 'Arial Narrow', 'Trebuchet MS', Arial, sans-serif";

// Compress only if text would overflow
function compress(text, fontSize, maxW) {
  const natural = text.length * fontSize * 0.58;
  return natural > maxW
    ? { textLength: maxW, lengthAdjust: "spacingAndGlyphs" }
    : {};
}

// Smart split for long titles
function splitName(text) {
  const up = text.toUpperCase();
  if (up.length <= 26) return [up, ""];
  const mid = Math.round(up.length * 0.52);
  let i = up.lastIndexOf(" ", mid);
  if (i < mid - 10) i = up.indexOf(" ", mid);
  if (i <= 0) return [up, ""];
  return [up.slice(0, i), up.slice(i + 1)];
}

export default function RectLabel({
  competitionName = "",
  category = "",
  position = "",
  locationDate = "",
  logoSrc = "",
  widthCm = 9.0,
  heightCm = 4.4,
  fontFamily = "",
}) {
  const w = widthCm * 10;
  const h = 44;
  const activeFont = fontFamily || FONT;

  const padding = 4;
  const logoSize = 18;
  const gap = 5;

  // text-safe area (prevents overlap with logo)
  const textLeft = logoSrc ? padding + logoSize + gap : padding;
  const textRight = w - padding;
  const textWidth = textRight - textLeft;
  const textCenter = textLeft + textWidth / 2;

  const [n1, n2] = splitName(competitionName);

  return (
    <svg
      width={`${widthCm}cm`}
      height={`${heightCm}cm`}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* border */}
      <rect
        x="0.8"
        y="0.8"
        width={w - 1.6}
        height={h - 1.6}
        fill="white"
        stroke={BORDER}
        strokeWidth="1"
        rx="1"
      />

      {/* logo */}
      {logoSrc && (
        <image
          href={logoSrc}
          x={padding - 1.5}
          y={(h - logoSize) / 1.1}
          width={logoSize}
          height={logoSize}
          preserveAspectRatio="xMidYMid meet"
        />
      )}

      {/* title line 1 */}
      <text
        x={textCenter}
        y="8"
        textAnchor="middle"
        fontSize="4"
        fontWeight="800"
        fontFamily={activeFont}
        {...compress(n1, 5, textWidth)}
      >
        {n1}
      </text>

      {/* title line 2 */}
      {n2 && (
        <text
          x={textCenter + 4.5}
          y="12"
          textAnchor="middle"
          fontSize="4"
          fontWeight="800"
          fontFamily={activeFont}
          {...compress(n2, 5, textWidth)}
        >
          {n2}
        </text>
      )}

      {/* category */}
      <text
        x={textCenter}
        y={n2 ? 24 : 20}
        textAnchor="middle"
        fontSize="8"
        fontWeight="400"
        fontFamily={activeFont}
        {...compress(category, 7, textWidth)}
      >
        {category}
      </text>

      {/* position */}
      <text
        x={textCenter}
        y={n2 ? 36 : 31}
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fontFamily={activeFont}
        {...compress(position.toUpperCase(), 14, textWidth)}
      >
        {position.toUpperCase()}
      </text>

      {/* date */}
      <text
        x={textRight}
        y={h - 3}
        textAnchor="end"
        fontSize="3.2"
        fontFamily={activeFont}
        fontStyle={"italic"}
      >
        {locationDate}
      </text>
    </svg>
  );
}
