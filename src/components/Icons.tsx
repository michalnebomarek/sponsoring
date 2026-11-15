type P = { size?: number };
const S = ({ size = 24, children }: P & { children: preact.ComponentChildren }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const IconToday = (p: P) => (
  <S {...p}>
    <path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 6.5V8.5M5.6 9.6l1.4 1.4M18.4 9.6 17 11" />
  </S>
);
export const IconTrail = (p: P) => (
  <S {...p}>
    <path d="m3 18 5-7 3.5 4L15 8l6 10H3Z" />
  </S>
);
export const IconNotes = (p: P) => (
  <S {...p}>
    <path d="M6 3.5h9l3 3V20.5H6z M9 10h6M9 13.5h6M9 17h3.5" />
  </S>
);
export const IconGlossary = (p: P) => (
  <S {...p}>
    <path d="M5 4.5h10.5a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3v-12Z M5 16.5a3 3 0 0 1 3-3h10.5" />
  </S>
);
export const IconSettings = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="2.6" />
    <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" />
  </S>
);
export const IconBack = (p: P) => (
  <S {...p}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </S>
);
export const IconCheck = (p: P) => (
  <S {...p}>
    <path d="m5.5 12.5 4 4 9-9" />
  </S>
);
export const IconLock = (p: P) => (
  <S {...p}>
    <rect x="6" y="10.5" width="12" height="9" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </S>
);
export const IconShare = (p: P) => (
  <S {...p}>
    <path d="M12 14.5V3.5M8 7.5l4-4 4 4M6.5 11H5.5v9.5h13V11h-1" />
  </S>
);
export const IconSearch = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.5-4.5" />
  </S>
);
export const IconChevron = (p: P) => (
  <S {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </S>
);
export const IconUp = (p: P) => (
  <S {...p}>
    <path d="M12 19V5.5M5.5 12 12 5.5l6.5 6.5" />
  </S>
);
