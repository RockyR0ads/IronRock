/** Line drawings of cable attachments, each hanging from the cable's carabiner. */
const CLIP = <rect x="21.5" y="1.5" width="5" height="7" rx="2.5" />;
const SWIVEL = (to: number) => <path d={`M24 8.5V${to}`} />;

const SHAPES: Record<string, JSX.Element> = {
  rope: (
    <>
      {CLIP}
      <rect x="20.5" y="9" width="7" height="6" rx="1.5" />
      <path d="M22 15c-1 9-7 13-8 23M26 15c1 9 7 13 8 23" />
      <rect x="11" y="37" width="6" height="8" rx="2.5" />
      <rect x="31" y="37" width="6" height="8" rx="2.5" />
    </>
  ),
  straight: (
    <>
      {CLIP}
      {SWIVEL(19)}
      <path d="M5 21h38" strokeWidth={3.5} />
      <path d="M5 17v8M43 17v8M15 19v4M19 19v4M29 19v4M33 19v4" />
    </>
  ),
  revolving: (
    <>
      {CLIP}
      {SWIVEL(19)}
      <path d="M14 21h20" />
      <rect x="4" y="17.5" width="10" height="7" rx="2" />
      <rect x="34" y="17.5" width="10" height="7" rx="2" />
      <path d="M7 17.5v7M11 17.5v7M37 17.5v7M41 17.5v7" />
    </>
  ),
  ez: (
    <>
      {CLIP}
      {SWIVEL(18)}
      <path d="M3 21h6l3-3 4 6 3-3h10l3 3 4-6 3 3h6" strokeWidth={3} />
    </>
  ),
  vbar: (
    <>
      {CLIP}
      {SWIVEL(12)}
      <path d="M24 12 14 30M24 12l10 18" strokeWidth={3} />
      <path d="m14 30-5 9M34 30l5 9" strokeWidth={4.5} />
    </>
  ),
  lat: (
    <>
      {CLIP}
      {SWIVEL(17)}
      <path d="M5 28c2-7 6-10 12-11h14c6 1 10 4 12 11" strokeWidth={3} />
      <path d="m5 28-2 7M43 28l2 7" strokeWidth={4.5} />
    </>
  ),
  neutrallat: (
    <>
      {CLIP}
      {SWIVEL(17)}
      <path d="M4 17h40" strokeWidth={3} />
      <path d="M7 17v13h6V17M35 17v13h6V17" />
      <path d="M10 22v6M38 22v6" strokeWidth={4} />
    </>
  ),
  closegrip: (
    <>
      {CLIP}
      {SWIVEL(12)}
      <path d="M24 12 14 32h20z" />
      <path d="M20 26v14M28 26v14" strokeWidth={4} />
    </>
  ),
  mag: (
    <>
      {CLIP}
      {SWIVEL(16)}
      <path d="M8 16h32" strokeWidth={3} />
      <path d="M12 16v8M36 16v8" />
      <rect x="9" y="24" width="6" height="15" rx="3" />
      <rect x="33" y="24" width="6" height="15" rx="3" />
    </>
  ),
  tbar: (
    <>
      {CLIP}
      {SWIVEL(18)}
      <path d="M8 32 14 18h20l6 14" strokeWidth={3} />
      <path d="M3 32h10M35 32h10" strokeWidth={4.5} />
    </>
  ),
  single: (
    <>
      {CLIP}
      <path d="M24 8.5 13 30h22z" />
      <rect x="12" y="30" width="24" height="8" rx="4" strokeWidth={3} />
    </>
  ),
  double: (
    <>
      <rect x="9.5" y="1.5" width="5" height="7" rx="2.5" />
      <rect x="33.5" y="1.5" width="5" height="7" rx="2.5" />
      <path d="M12 8.5 5 26h14zM36 8.5 29 26h14z" />
      <rect x="4" y="26" width="16" height="7" rx="3.5" strokeWidth={3} />
      <rect x="28" y="26" width="16" height="7" rx="3.5" strokeWidth={3} />
    </>
  ),
  stirrup: (
    <>
      {CLIP}
      {SWIVEL(12)}
      <path d="M24 12c-8 0-12 6-12 14 0 7 5 12 12 12s12-5 12-12c0-8-4-14-12-14z" />
      <path d="M15 34h18" strokeWidth={5} />
    </>
  ),
  cuff: (
    <>
      {CLIP}
      <path d="M20 21c0-6 8-6 8 0" />
      <rect x="14" y="21" width="20" height="12" rx="6" strokeWidth={3} />
      <path d="M20 24v6M24 24v6" />
      <path d="M17 33l-3 10M31 33l3 10" />
    </>
  ),
  ankle: (
    <>
      {CLIP}
      <path d="M20 19c0-6 8-6 8 0" />
      <rect x="10" y="19" width="28" height="16" rx="8" strokeWidth={3} />
      <path d="M17 23v8M21 23v8" />
    </>
  ),
  harness: (
    <>
      {CLIP}
      {SWIVEL(14)}
      <path d="M12 14h24" strokeWidth={3} />
      <path d="M14 14c-4 8-4 16 2 24M34 14c4 8 4 16-2 24" />
      <rect x="11" y="34" width="8" height="8" rx="3" />
      <rect x="29" y="34" width="8" height="8" rx="3" />
    </>
  ),
  none: (
    <>
      <path d="M24 1.5V24" />
      <circle cx="24" cy="29" r="5" strokeWidth={3} />
      <path d="M19 40h10" />
    </>
  ),
};

export function AttachmentIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {SHAPES[id] ?? SHAPES.none}
    </svg>
  );
}
