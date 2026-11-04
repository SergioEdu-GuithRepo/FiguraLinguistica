import React from "react";

export type IconName =
  | "home"
  | "book"
  | "headphones"
  | "user"
  | "bell"
  | "search"
  | "filter"
  | "play"
  | "pause"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "close"
  | "check"
  | "mic"
  | "send"
  | "volume"
  | "flame"
  | "bookmark"
  | "flag"
  | "lock"
  | "chat"
  | "puzzle"
  | "cards"
  | "blocks"
  | "download"
  | "logout"
  | "sparkles"
  | "help"
  | "refresh"
  | "trash"
  | "clock"
  | "trophy"
  | "bolt"
  | "pen"
  | "stop"
  | "eye"
  | "layers"
  | "translate";

const paths: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />,
  book: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3" y="14" width="4" height="7" rx="1.5" />
      <rect x="17" y="14" width="4" height="7" rx="1.5" />
      <path d="M10 15v3M12 13v7M14 15v3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 21h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  filter: <path d="M5 4v6M5 14v6M12 4v10M12 18v2M19 4v2M19 10v10M3 12h4M10 16h4M17 8h4" />,
  play: <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  send: <path d="M4 12 20 4l-6 16-3-7-7-1Z" />,
  volume: (
    <>
      <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4v-5Z" />
      <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  flame: <path d="M12 21c-4 0-7-2.8-7-6.6 0-3.4 2.4-5.5 3.6-8.4.4 2 1.6 3.2 2.8 3.6C11.4 6.4 13 4 15 3c-.3 2.8 4 5.8 4 11.4C19 18.2 16 21 12 21Z" />,
  bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  chat: <path d="M4 5h16v11H9l-5 4V5Z" />,
  puzzle: <path d="M10 4h4v3a1.5 1.5 0 1 0 3 0V4h3v6h-3a1.5 1.5 0 1 0 0 3h3v7h-6v-3a1.5 1.5 0 1 0-3 0v3H4v-7h3a1.5 1.5 0 1 0 0-3H4V4h6Z" />,
  cards: (
    <>
      <rect x="7" y="4" width="13" height="16" rx="2" />
      <path d="M4 7v11a2 2 0 0 0 2 2" />
    </>
  ),
  blocks: (
    <>
      <rect x="3" y="4" width="8" height="6" rx="1.5" />
      <rect x="13" y="4" width="8" height="6" rx="1.5" />
      <rect x="7" y="14" width="10" height="6" rx="1.5" />
    </>
  ),
  download: <path d="M12 4v11M7 10.5 12 15.5 17 10.5M5 20h14" />,
  logout: <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" />,
  sparkles: <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6v4H9z" />,
  bolt: <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />,
  pen: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  layers: <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5" />,
  translate: <path d="M4 5h9M8.5 3v2M6 5c.5 3 2.5 6 6 7.5M11 5c-.5 3-3 6.5-7 8M13 21l4-10 4 10M14.5 17.5h5" />,
};

export function Icon({
  name,
  size = 24,
  filled = false,
  className = "",
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "var(--icon-fill, currentColor)" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
