export const PROFILE_ACCENT_OPTIONS = [
  {
    key: "emerald",
    label: "Verde",
    titleTextClass: "text-emerald-300",
    badgeWrapClass: "bg-emerald-300/15 ring-emerald-200/20",
    badgeTextClass: "text-emerald-100",
  },
  {
    key: "sky",
    label: "Azul",
    titleTextClass: "text-sky-300",
    badgeWrapClass: "bg-sky-400/15 ring-sky-300/20",
    badgeTextClass: "text-sky-100",
  },
  {
    key: "rose",
    label: "Rojo",
    titleTextClass: "text-rose-300",
    badgeWrapClass: "bg-rose-500/15 ring-rose-400/20",
    badgeTextClass: "text-rose-100",
  },
  {
    key: "neutral",
    label: "Neutro",
    titleTextClass: "text-white",
    badgeWrapClass: "bg-white/10 ring-white/10",
    badgeTextClass: "text-white",
  },
];

export const PROFILE_BANNER_OPTIONS = [
  { key: "none", label: "Sin banner" },
  { key: "classic", label: "Clásico" },
  { key: "emerald", label: "Verde" },
  { key: "sky", label: "Azul" },
  { key: "rose", label: "Rojo" },
];

export function isProfileAccentKey(key) {
  const k = String(key || "");
  return PROFILE_ACCENT_OPTIONS.some((o) => o.key === k);
}

export function isProfileBannerKey(key) {
  const k = String(key || "");
  return PROFILE_BANNER_OPTIONS.some((o) => o.key === k);
}

export function getProfileAccent(key) {
  const k = String(key || "");
  return (
    PROFILE_ACCENT_OPTIONS.find((o) => o.key === k) || PROFILE_ACCENT_OPTIONS[0]
  );
}

/**
 * Devuelve capas de "blobs" para el header (mismo patrón que Home).
 * Importante: clases explícitas para que Tailwind las incluya.
 */
export function getProfileBannerLayers(key) {
  const k = String(key || "none");
  if (k === "none") return [];

  if (k === "emerald") {
    return [
      {
        class:
          "absolute w-72 h-72 rounded-full -top-28 -right-24 bg-emerald-400/10 blur-3xl",
      },
      {
        class:
          "absolute w-56 h-56 rounded-full -bottom-28 -left-16 bg-emerald-400/10 blur-3xl",
      },
    ];
  }

  if (k === "sky") {
    return [
      {
        class:
          "absolute w-72 h-72 rounded-full -top-28 -right-24 bg-sky-400/10 blur-3xl",
      },
      {
        class:
          "absolute w-56 h-56 rounded-full -bottom-28 -left-16 bg-sky-400/10 blur-3xl",
      },
    ];
  }

  if (k === "rose") {
    return [
      {
        class:
          "absolute w-72 h-72 rounded-full -top-28 -right-24 bg-rose-500/10 blur-3xl",
      },
      {
        class:
          "absolute w-56 h-56 rounded-full -bottom-28 -left-16 bg-rose-500/10 blur-3xl",
      },
    ];
  }

  // classic (default)
  return [
    {
      class:
        "absolute w-64 h-64 rounded-full -top-24 -right-24 bg-emerald-400/10 blur-3xl",
    },
    {
      class:
        "absolute rounded-full -bottom-28 -left-24 h-72 w-72 bg-sky-400/10 blur-3xl",
    },
  ];
}
