/** Dres za dokončený týden. Liniová kresba, každý týden jiný detail. */

const OUTLINE =
  'M11 4.5 6.5 6.6 2.5 12.5l4 3 1.8-1.9V28h15.4V13.6l1.8 1.9 4-3-4-5.9L21 4.5c-1.2 2.1-2.9 3.1-5 3.1s-3.8-1-5-3.1Z';

function Detail({ week }: { week: number }) {
  switch (((week - 1) % 8) + 1) {
    case 1: // pruh přes hruď
      return <path d="M8.3 15.5h15.4" />;
    case 2: // puntíky
      return (
        <g class="jersey-fill">
          {[
            [12, 12],
            [19, 11.5],
            [15.5, 16],
            [11, 20],
            [20, 19],
            [15.5, 24],
          ].map(([x, y]) => (
            <circle cx={x} cy={y} r="1.3" />
          ))}
        </g>
      );
    case 3: // číslo
      return (
        <text x="16" y="21.5" class="jersey-num">
          3
        </text>
      );
    case 4: // svislý pruh
      return <path d="M16 7.6V28" />;
    case 5: // šerpa
      return <path d="M9 12.5 23.5 25" />;
    case 6: // dva pruhy
      return <path d="M8.3 14h15.4M8.3 18h15.4" />;
    case 7: // šipka
      return <path d="m8.8 13.5 7.2 5 7.2-5" />;
    default: // žlutý dres na konec
      return <path d={OUTLINE} class="jersey-fill jersey-leader" />;
  }
}

export function Jersey({ week, earned, size = 36 }: { week: number; earned: boolean; size?: number }) {
  return (
    <svg
      class={`jersey${earned ? ' jersey--earned' : ''}`}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label={earned ? `Dres za týden ${week}` : `Dres za týden ${week} – zatím nezískaný`}
    >
      {earned && <Detail week={week} />}
      <path d={OUTLINE} class="jersey-outline" />
    </svg>
  );
}
