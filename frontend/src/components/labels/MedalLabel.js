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
  const size = 25;
  const vb = 200;
  const cx = 100;
  const cy = 100;
  const radius = 94;
  const outerTop = 104;
  const innerTop = 84;
  const bottomInner = 84;

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
          d={`M ${cx - bottomInner},${cy + 3} A ${bottomInner},${bottomInner} 0 0,0 ${cx + bottomInner},${cy + 3}`}
        />
        <clipPath id={`${uid}-logo`}>
          <circle cx={cx} cy={cy} r="64" />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={radius} fill="white" stroke={CUT_COLOR} strokeWidth="1" />

      {logoSrc ? (
        <image
          href={logoSrc}
          x="36"
          y="36"
          width="128"
          height="128"
          preserveAspectRatio="xMidYMid meet"
          clipPath={`url(#${uid}-logo)`}
        />
      ) : null}

      {raceTitleRow1 ? (
        <text
          fontFamily={FONT_FAMILY}
          fontSize="17"
          fontWeight="700"
          fill="#000"
          textAnchor="middle"
        >
          <textPath href={`#${uid}-top-1`} startOffset="50%">
            {upper(raceTitleRow1)}
          </textPath>
        </text>
      ) : null}

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

      {locationDate ? (
        <text
          fontFamily={FONT_FAMILY}
          fontSize="17"
          fontWeight="700"
          fill="#000"
          textAnchor="middle"
          {...(locationDate.length > 30 ? { textLength: "240", lengthAdjust: "spacingAndGlyphs" } : {})}
        >
          <textPath href={`#${uid}-bottom`} startOffset="50%">
            {upper(locationDate)}
          </textPath>
        </text>
      ) : null}
    </svg>
  );
}
