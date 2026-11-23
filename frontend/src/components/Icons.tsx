import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 16, className = ""): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.65,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: `shrink-0 ${className}`.trim(),
});

export const IconSearch = ({ size = 16, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconHeart = ({
  size = 16,
  filled = false,
  className,
  ...p
}: IconProps & { filled?: boolean }) => (
  <svg {...base(size, className)} fill={filled ? "currentColor" : "none"} {...p}>
    <path d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572" />
  </svg>
);

export const IconMapPin = ({ size = 15, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const IconPhone = ({ size = 15, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const IconClock = ({ size = 14, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconTicket = ({ size = 16, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" />
    <path d="M13 17v2" />
    <path d="M13 11v2" />
  </svg>
);

export const IconUtensils = ({ size = 16, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

export const IconStore = ({ size = 16, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
  </svg>
);

export const IconChart = ({ size = 16, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 16v-5" />
    <path d="M12 16V8" />
    <path d="M17 16v-3" />
  </svg>
);

export const IconCheckCircle = ({ size = 16, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const IconEdit = ({ size = 15, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const IconCopy = ({ size = 15, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const IconShare = ({ size = 15, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

export const IconLink = ({ size = 14, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export const IconTrash = ({ size = 15, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export const IconDownload = ({ size = 14, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

export const IconFlame = ({ size = 14, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const IconUser = ({ size = 14, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </svg>
);

export const IconLock = ({ size = 18, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const IconEye = ({ size = 14, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconSparkles = ({ size = 16, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

export const IconCamera = ({ size = 18, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const IconTrophy = ({ size = 14, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export const IconZap = ({ size = 16, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M13 2 4.5 13.5h6.5L10 22l9.5-11.5h-6.5L13 2Z" />
  </svg>
);

export const IconStar = ({ size = 11, className, ...p }: IconProps) => (
  <svg
    {...base(size, className)}
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={1.2}
    {...p}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const IconAlert = ({ size = 15, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

export const IconArrowLeft = ({ size = 14, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

export const IconArrowRight = ({ size = 14, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const IconMenu = ({ size = 18, className, ...p }: IconProps) => (
  <svg {...base(size, className)} {...p}>
    <line x1="4" x2="20" y1="7" y2="7" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="17" y2="17" />
  </svg>
);

/**
 * Iconografía gastronómica minimalista de trazo fino para las especialidades del catálogo.
 */
export const CategoryIcon = ({
  name,
  size = 15,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) => {
  const n = name.toLowerCase();

  // Comida Rápida / Burger minimalista
  if (n.includes("rápida") || n.includes("burger") || n.includes("hamburguesa")) {
    return (
      <svg {...base(size, className)}>
        <path d="M4 11a8 8 0 0 1 16 0Z" />
        <path d="M3 14h18" />
        <path d="M4 17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2Z" />
      </svg>
    );
  }

  // Comida Mexicana / Taco minimalista
  if (n.includes("mexicana") || n.includes("taco")) {
    return (
      <svg {...base(size, className)}>
        <path d="M3 16a9 9 0 0 1 18 0Z" />
        <path d="M7 13c1-1.5 2.5-2 4-1" />
        <path d="M13 12c1.2-.8 2.8-.5 3.5 1" />
      </svg>
    );
  }

  // Sushi / Roll japonés minimalista
  if (n.includes("sushi") || n.includes("japonesa")) {
    return (
      <svg {...base(size, className)}>
        <ellipse cx="12" cy="10" rx="7" ry="4" />
        <path d="M5 10v4c0 2.2 3.1 4 7 4s7-1.8 7-4v-4" />
        <ellipse cx="12" cy="10" rx="2.5" ry="1.3" />
      </svg>
    );
  }

  // Postres / Repostería minimalista
  if (n.includes("postre") || n.includes("dulce")) {
    return (
      <svg {...base(size, className)}>
        <path d="M4 14l8-6 8 6v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5Z" />
        <path d="M4 16.5h16" />
        <circle cx="12" cy="6" r="1.5" />
      </svg>
    );
  }

  // Bebidas / Café de especialidad minimalista
  if (n.includes("bebida") || n.includes("café")) {
    return (
      <svg {...base(size, className)}>
        <path d="M17 8h1a3 3 0 0 1 0 6h-1" />
        <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
        <path d="M7 3v2" />
        <path d="M12 3v2" />
      </svg>
    );
  }

  // Comida Saludable / Hoja botánica minimalista
  if (n.includes("saludable") || n.includes("bowl")) {
    return (
      <svg {...base(size, className)}>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    );
  }

  // Italiana / Pizza artesanal minimalista
  if (n.includes("italiana") || n.includes("pizza")) {
    return (
      <svg {...base(size, className)}>
        <path d="M12 3 4 20a18 18 0 0 0 16 0L12 3Z" />
        <path d="M6.2 15.5a13 13 0 0 0 11.6 0" />
        <circle cx="11" cy="11" r="1" />
        <circle cx="13.5" cy="13.5" r="1" />
      </svg>
    );
  }

  // Mariscos / Pescado minimalista
  if (n.includes("marisco") || n.includes("pescado")) {
    return (
      <svg {...base(size, className)}>
        <path d="M6.5 12c2-4 6-6 11.5-5-1 5.5-3 9.5-7.5 11.5-1.8-.8-3.2-2.2-4-6.5Z" />
        <path d="M18 7l3-3" />
        <path d="M18 7l3 3" />
        <circle cx="10.5" cy="10.5" r="0.8" />
      </svg>
    );
  }

  // Todos / Cubiertos minimalistas
  return <IconUtensils size={size} className={className} />;
};

export const IconInstagram = ({ size = 16, className = "" }: IconProps) => (
  <svg {...base(size, className)}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

/**
 * Convierte un usuario (@restaurante o restaurante) o URL en un enlace válido de Instagram.
 */
export function normalizeInstagramUrl(raw?: string | null, fallbackName?: string): string {
  const cleaned = (raw || "").trim();
  if (cleaned) {
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    const handle = cleaned
      .replace(/^@/, "")
      .replace(/^(www\.)?instagram\.com\//i, "")
      .replace(/\/+$/, "");
    if (handle) return `https://www.instagram.com/${handle}`;
  }
  if (fallbackName) {
    const slug = fallbackName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug) return `https://www.instagram.com/${slug}`;
  }
  return "https://www.instagram.com/";
}

/**
 * Extrae el handle legible (@restaurante) a partir de una URL o usuario de Instagram.
 */
export function formatInstagramHandle(raw?: string | null, fallbackName?: string): string {
  const cleaned = (raw || "").trim();
  if (cleaned) {
    const handle = cleaned
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .split(/[/?#]/)[0];
    if (handle) return `@${handle}`;
  }
  if (fallbackName) {
    const slug = fallbackName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug) return `@${slug}`;
  }
  return "Instagram";
}
