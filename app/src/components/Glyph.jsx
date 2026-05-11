export function Glyph({ name, size = 16 }) {
  const s = size;
  const stroke = 1.5;
  const props = {
    width: s, height: s, viewBox: '0 0 16 16', fill: 'none',
    stroke: 'currentColor', strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };

  switch (name) {
    case 'audit':
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="6" />
          <circle cx="8" cy="8" r="3" />
          <circle cx="8" cy="8" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'product':
      return (
        <svg {...props}>
          <rect x="2.5" y="5" width="11" height="8" rx="1" />
          <path d="M4.5 3.5h7" />
          <path d="M2.5 8h11" />
        </svg>
      );
    case 'compete':
      return (
        <svg {...props}>
          <path d="M5.5 2.5l3 3-3 3-3-3 3-3z" />
          <path d="M10.5 7.5l3 3-3 3-3-3 3-3z" />
        </svg>
      );
    case 'legal':
      return (
        <svg {...props}>
          <path d="M3.5 2.5h6l3 3v8a0 0 0 0 1 0 0h-9z" />
          <path d="M9.5 2.5v3h3" />
          <path d="M5.5 9h5" />
          <path d="M5.5 11h3" />
        </svg>
      );
    case 'contract':
      return (
        <svg {...props}>
          <path d="M2 8h4l1.5 1.5L9 8h5" />
          <path d="M5 5l-3 3 3 3" />
          <path d="M11 5l3 3-3 3" />
        </svg>
      );
    case 'invoice':
      return (
        <svg {...props}>
          <path d="M3.5 2.5h9v11l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1z" />
          <path d="M5.5 5.5h5" />
          <path d="M5.5 8h5" />
        </svg>
      );
    case 'status':
      return (
        <svg {...props}>
          <circle cx="8" cy="3" r="1.2" />
          <circle cx="3.5" cy="13" r="1.2" />
          <circle cx="12.5" cy="13" r="1.2" />
          <path d="M8 4.2v3M8 7.5l-4 4M8 7.5l4 4" />
        </svg>
      );
    case 'linkedin-content':
      return (
        <svg {...props}>
          <path d="M2.5 4a1.5 1.5 0 0 1 1.5-1.5h8A1.5 1.5 0 0 1 13.5 4v5A1.5 1.5 0 0 1 12 10.5H6.5L4 13v-2.5h0A1.5 1.5 0 0 1 2.5 9z" />
          <circle cx="6" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
          <circle cx="8" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
          <circle cx="10" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'linkedin-profile':
      return (
        <svg {...props}>
          <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
          <circle cx="8" cy="6.5" r="1.5" />
          <path d="M5 12c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5" />
        </svg>
      );
    case 'home':
      return <svg {...props}><path d="M2.5 7.5l5.5-5 5.5 5v6h-4v-4h-3v4h-4z" /></svg>;
    case 'account':
      return <svg {...props}><circle cx="8" cy="5.5" r="2.5" /><path d="M3 13.5c0-2.5 2.2-4 5-4s5 1.5 5 4" /></svg>;
    case 'billing':
      return <svg {...props}><rect x="2" y="4" width="12" height="9" rx="1.5" /><path d="M2 7h12" /><path d="M5 11h2" /></svg>;
    case 'logout':
      return <svg {...props}><path d="M9 3.5H4.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1H9" /><path d="M11 5.5l2.5 2.5L11 10.5" /><path d="M7 8h6.5" /></svg>;
    case 'sparkle':
      return <svg {...props}><path d="M8 2v4M8 10v4M2 8h4M10 8h4" /></svg>;
    case 'check':
      return <svg {...props}><path d="M3 8.5l3 3 7-7" /></svg>;
    case 'check-circle':
      return <svg {...props}><circle cx="8" cy="8" r="6" /><path d="M5.5 8l2 2 3-4" /></svg>;
    case 'x':
      return <svg {...props}><path d="M4 4l8 8M12 4l-8 8" /></svg>;
    case 'arrow-right':
      return <svg {...props}><path d="M3 8h10M9 4l4 4-4 4" /></svg>;
    case 'chevron-right':
      return <svg {...props}><path d="M6 3l5 5-5 5" /></svg>;
    case 'chevron-down':
      return <svg {...props}><path d="M3 6l5 5 5-5" /></svg>;
    case 'copy':
      return <svg {...props}><rect x="5" y="5" width="8" height="8" rx="1" /><path d="M11 5V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1" /></svg>;
    case 'refresh':
      return <svg {...props}><path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4" /><path d="M12.5 1.5v3h-3M3.5 14.5v-3h3" /></svg>;
    case 'lock':
      return <svg {...props}><rect x="3" y="7" width="10" height="7" rx="1" /><path d="M5 7V5a3 3 0 0 1 6 0v2" /></svg>;
    case 'eye':
      return <svg {...props}><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" /><circle cx="8" cy="8" r="1.5" /></svg>;
    case 'card':
      return <svg {...props}><rect x="2" y="4" width="12" height="9" rx="1.5" /><path d="M2 7h12" /></svg>;
    case 'shield':
      return <svg {...props}><path d="M8 2L3 4v4c0 3 2 5 5 6 3-1 5-3 5-6V4z" /></svg>;
    case 'menu':
      return <svg {...props}><path d="M3 5h10M3 8h10M3 11h10" /></svg>;
    case 'plus':
      return <svg {...props}><path d="M8 3v10M3 8h10" /></svg>;
    case 'arrow-left':
      return <svg {...props}><path d="M13 8H3M7 4L3 8l4 4" /></svg>;
    case 'star':
      return <svg {...props}><path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" /></svg>;
    case 'lightning':
      return <svg {...props}><path d="M9 1.5L3 9h4l-1 5.5 6-7.5H8z" /></svg>;
    default:
      return <svg {...props}><rect x="3" y="3" width="10" height="10" rx="1" /></svg>;
  }
}
