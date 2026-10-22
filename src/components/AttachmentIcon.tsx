/** Line drawings of cable attachments, each hanging from a carabiner clip. */
const CLIP = <path d="M24 3v6" />;

const SHAPES: Record<string, JSX.Element> = {
  rope: (
    <>
      {CLIP}
      <path d="M24 9c-2 4-6 6-8 12s-1 12-2 18M24 9c2 4 6 6 8 12s1 12 2 18" />
      <circle cx="14" cy="41" r="2.5" />
      <circle cx="34" cy="41" r="2.5" />
    </>
  ),
  straight: (
    <>
      {CLIP}
      <path d="M24 9v8M6 18h36" />
      <path d="M8 16v4M40 16v4" />
    </>
  ),
  ez: (
    <>
      {CLIP}
      <path d="M24 9v8M4 18h6l4 4 4-4h12l4 4 4-4h6" />
    </>
  ),
  vbar: (
    <>
      {CLIP}
      <path d="M24 9v4l-8 22M24 13l8 22" />
      <path d="M13 35h6M29 35h6" />
    </>
  ),
  lat: (
    <>
      {CLIP}
      <path d="M24 9v6M2 22c6-6 14-7 22-7s16 1 22 7" />
      <path d="M3 21l-1 6M45 21l1 6" />
    </>
  ),
  closegrip: (
    <>
      {CLIP}
      <path d="M24 9v6M14 15h20l-4 22H18z" />
      <path d="M18 30h12" />
    </>
  ),
  single: (
    <>
      {CLIP}
      <path d="M24 9v5M14 14h20M14 14c0 12 4 22 10 22s10-10 10-22" />
      <path d="M18 34h12" />
    </>
  ),
  double: (
    <>
      <path d="M14 3v6M34 3v6" />
      <path d="M8 13h12M8 13c0 9 2 16 6 16s6-7 6-16M28 13h12M28 13c0 9 2 16 6 16s6-7 6-16" />
      <path d="M10 28h8M30 28h8" />
    </>
  ),
  mag: (
    <>
      {CLIP}
      <path d="M24 9v8M8 17h32" />
      <path d="M12 17v18h8V17M28 17v18h8V17" />
    </>
  ),
  ankle: (
    <>
      {CLIP}
      <path d="M24 9v6" />
      <rect x="12" y="15" width="24" height="22" rx="8" />
      <path d="M12 26h24" />
    </>
  ),
  none: (
    <>
      {CLIP}
      <circle cx="24" cy="15" r="6" />
      <path d="M14 34l20-12" />
    </>
  ),
};

export function AttachmentIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {SHAPES[id] ?? SHAPES.none}
    </svg>
  );
}
