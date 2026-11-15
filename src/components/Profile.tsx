/**
 * Kurz jako výškový profil etapového závodu.
 * 8 etap (týdnů) × 5 kilometrovníků (lekcí). Tvar je pevný, aby
 * profil vypadal pokaždé stejně.
 */
import { LESSONS_PER_WEEK } from '../course';

// Výšky v bodech 0–40 (0 = start). Ručně laděné: rozjezd, kopce,
// první velké stoupání ve 3. etapě, sjezd, a cíl na vrcholu v 8. etapě.
const SHAPE = [
  0.16,
  0.22, 0.2, 0.27, 0.24, 0.29,
  0.35, 0.3, 0.41, 0.37, 0.33,
  0.43, 0.56, 0.67, 0.61, 0.48,
  0.39, 0.31, 0.35, 0.28, 0.25,
  0.33, 0.45, 0.4, 0.51, 0.43,
  0.53, 0.65, 0.77, 0.7, 0.58,
  0.49, 0.53, 0.45, 0.51, 0.57,
  0.65, 0.73, 0.83, 0.91, 0.97,
];

type Props = {
  totalWeeks: number;
  /** slot (0–39) → hotovo */
  doneSlots: Set<number>;
  /** kolik lekcí je hotovo = kde je jezdec */
  rider: number;
  availableWeeks: Set<number>;
  compact?: boolean;
  onStage?: (n: number) => void;
};

export function Profile({ totalWeeks, doneSlots, rider, availableWeeks, compact, onStage }: Props) {
  const n = totalWeeks * LESSONS_PER_WEEK;
  const W = 360;
  const H = compact ? 84 : 148;
  const padX = 8;
  const top = compact ? 10 : 14;
  const base = compact ? H - 8 : H - 30;
  const h = (i: number) => (i <= 40 ? SHAPE[i] : SHAPE[((i - 1) % 40) + 1]);
  const pts = Array.from({ length: n + 1 }, (_, i) => ({
    x: padX + (i * (W - 2 * padX)) / n,
    y: base - h(i) * (base - top),
  }));

  // hladká křivka přes body (Catmull-Rom → Bézier)
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  const fill = `${d} L${pts[n].x.toFixed(1)},${base} L${pts[0].x.toFixed(1)},${base} Z`;
  const r = Math.max(0, Math.min(n, rider));
  const rp = pts[r];
  const clipId = compact ? 'pc-c' : 'pc-f';
  const stageW = (W - 2 * padX) / totalWeeks;

  return (
    <svg
      class={`profile${compact ? ' profile--compact' : ''}`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Výškový profil kurzu. Hotovo ${rider} z ${n} lekcí.`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" height={H} width={rp.x} class="profile-clip" />
        </clipPath>
      </defs>
      <path d={fill} class="profile-fill" />
      {/* hranice etap */}
      {Array.from({ length: totalWeeks - 1 }, (_, k) => {
        const p = pts[(k + 1) * LESSONS_PER_WEEK];
        return <line key={k} x1={p.x} x2={p.x} y1={p.y + 4} y2={base} class="profile-stage" />;
      })}
      <path d={d} class="profile-line" />
      <path d={d} class="profile-done" clip-path={`url(#${clipId})`} />
      {/* kilometrovníky */}
      {pts.slice(1).map((p, i) => {
        const week = Math.floor(i / LESSONS_PER_WEEK) + 1;
        const cls = doneSlots.has(i)
          ? 'km km--done'
          : availableWeeks.has(week)
            ? 'km'
            : 'km km--locked';
        return <circle key={i} cx={p.x} cy={p.y} r={compact ? 1.6 : 2.1} class={cls} />;
      })}
      {/* cílová vlajka */}
      <g transform={`translate(${pts[n].x - 1} ${pts[n].y - (compact ? 12 : 16)})`} class="profile-flag">
        <line x1="0" y1="0" x2="0" y2={compact ? 12 : 16} />
        <rect x="0" y="0" width="7" height="5" />
      </g>
      {/* jezdec */}
      <g class="rider" style={{ transform: `translate(${rp.x}px, ${rp.y}px)` }}>
        <circle r={compact ? 7 : 9} class="rider-halo" />
        <circle r={compact ? 4 : 5} class="rider-dot" />
      </g>
      {!compact &&
        Array.from({ length: totalWeeks }, (_, k) => (
          <text
            key={k}
            x={padX + stageW * (k + 0.5)}
            y={H - 10}
            class={`profile-label${availableWeeks.has(k + 1) ? '' : ' profile-label--locked'}`}
          >
            {k + 1}
          </text>
        ))}
      {onStage &&
        Array.from({ length: totalWeeks }, (_, k) => (
          <rect
            key={k}
            x={padX + stageW * k}
            y="0"
            width={stageW}
            height={H}
            class="profile-hit"
            onClick={() => onStage(k + 1)}
          >
            <title>Etapa {k + 1}</title>
          </rect>
        ))}
    </svg>
  );
}
