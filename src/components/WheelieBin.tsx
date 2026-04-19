type Props = {
  color: string;
  size?: number;
  className?: string;
  title?: string;
};

export function WheelieBin({ color, size = 24, className, title }: Props) {
  const lidHeight = 4;
  const w = size;
  const h = size;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <rect
        x="2.5"
        y={2 + lidHeight}
        width="19"
        height="2.2"
        rx="0.6"
        fill={color}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.4"
      />
      <path
        d="M6 2.2 H18 a1.3 1.3 0 0 1 1.3 1.3 V5 H4.7 V3.5 A1.3 1.3 0 0 1 6 2.2 Z"
        fill={color}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="0.4"
      />
      <path
        d="M4.8 8.4 H19.2 L18.1 20.2 A1.4 1.4 0 0 1 16.7 21.5 H7.3 A1.4 1.4 0 0 1 5.9 20.2 Z"
        fill={color}
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="0.5"
      />
      <line x1="9" y1="10.5" x2="8.4" y2="19.5" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="12" y1="10.5" x2="12" y2="19.5" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="15" y1="10.5" x2="15.6" y2="19.5" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" strokeLinecap="round" />
      <circle cx="8" cy="22" r="1.1" fill="#111" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
      <circle cx="16" cy="22" r="1.1" fill="#111" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
    </svg>
  );
}
