/** The small barbell motif from the header — loaded plates on a bar. */
export function Barbell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 340 8" aria-hidden="true">
      <rect x="0" y="3" width="340" height="2" fill="#33383F" />
      <rect x="40" y="0" width="6" height="8" fill="#CA463B" />
      <rect x="50" y="0" width="6" height="8" fill="#2F6DB5" />
      <rect x="60" y="1" width="5" height="6" fill="#E0B23C" />
      <rect x="276" y="1" width="5" height="6" fill="#E0B23C" />
      <rect x="285" y="0" width="6" height="8" fill="#2F6DB5" />
      <rect x="295" y="0" width="6" height="8" fill="#CA463B" />
    </svg>
  );
}
