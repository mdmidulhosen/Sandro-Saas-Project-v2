const RING_COLOR = '#CC007A';
const FONT = "Futura, 'Arial Narrow', 'Trebuchet MS', Arial, sans-serif";

export default function RetroLabel({ category = '', subCategory = '', position = '', locationDate = '', diameterMm = 40 }) {
  const S = 200;
  const cx = 100, cy = 100;
  const r = 93;
  const ri = 77;

  const hasSubCat = Boolean(subCategory);
  const lineCount = hasSubCat ? 4 : 3;
  const totalH = lineCount * 22 + 20;
  const startY = cy - totalH / 2 + 14;

  const catFs = diameterMm >= 50 ? 16 : 14;
  const subFs = diameterMm >= 50 ? 13 : 11;
  const posFs = diameterMm >= 50 ? 23 : 20;
  const dateFs = diameterMm >= 50 ? 12 : 10;

  let y = startY;

  return (
    <svg
      width={`${diameterMm}mm`}
      height={`${diameterMm}mm`}
      viewBox={`0 0 ${S} ${S}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* White background */}
      <circle cx={cx} cy={cy} r={r} fill="white" />
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={RING_COLOR} strokeWidth="3.5" />
      {/* Inner decorative ring */}
      <circle cx={cx} cy={cy} r={ri} fill="none" stroke={RING_COLOR} strokeWidth="1.5" />

      {/* Category name */}
      <text x={cx} y={y} textAnchor="middle" fontSize={catFs} fontWeight="900"
        fontFamily={FONT} fill="black" dominantBaseline="middle">
        {category.toUpperCase()}
      </text>

      {/* Sub-category (apparatus) */}
      {hasSubCat && (
        <text x={cx} y={y + catFs + 6} textAnchor="middle" fontSize={subFs} fontWeight="800"
          fontFamily={FONT} fill="black" dominantBaseline="middle">
          {subCategory.toUpperCase()}
        </text>
      )}

      {/* Position */}
      <text
        x={cx}
        y={y + catFs + 6 + (hasSubCat ? subFs + 10 : 8)}
        textAnchor="middle"
        fontSize={posFs}
        fontWeight="900"
        fontFamily={FONT}
        fill="black"
        dominantBaseline="middle"
      >
        {position}
      </text>

      {/* Date */}
      {locationDate && (
        <text
          x={cx}
          y={y + catFs + 6 + (hasSubCat ? subFs + 10 : 8) + posFs + 10}
          textAnchor="middle"
          fontSize={dateFs}
          fontWeight="700"
          fontFamily={FONT}
          fill="black"
          dominantBaseline="middle"
          opacity="0.9"
        >
          {locationDate}
        </text>
      )}
    </svg>
  );
}
