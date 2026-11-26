export function CheeseDripDivider({
  topColor = '#FFC72C',
  bottomColor = '#D91E18',
  className = '',
}: {
  topColor?: string;
  bottomColor?: string;
  className?: string;
}) {
  const dripPath =
    'M0,0 L0,32 C36,32 42,76 68,76 C94,76 98,38 132,38 C164,38 170,98 202,98 C234,98 238,42 276,42 C312,42 318,70 348,70 C378,70 382,30 420,30 C458,30 464,104 498,104 C532,104 536,44 574,44 C610,44 614,74 644,74 C674,74 680,32 720,32 C760,32 766,94 800,94 C834,94 840,40 878,40 C914,40 920,78 952,78 C984,78 990,34 1030,34 C1068,34 1074,102 1108,102 C1142,102 1148,42 1188,42 C1224,42 1230,72 1262,72 C1294,72 1300,34 1338,34 C1374,34 1380,82 1410,82 C1428,82 1436,52 1440,40 L1440,0 Z';

  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-hidden leading-none ${className}`}
      style={{ backgroundColor: bottomColor }}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="block w-full h-11 sm:h-14 md:h-16"
      >
        <path
          d={dripPath}
          transform="translate(0, 5)"
          fill="#7F1D1D"
          fillOpacity="0.18"
        />
        <path d={dripPath} fill={topColor} />
        <circle cx="202" cy="111" r="4.5" fill={topColor} />
        <circle cx="498" cy="114" r="4" fill={topColor} />
        <circle cx="1108" cy="113" r="4.5" fill={topColor} />
      </svg>
    </div>
  );
}
