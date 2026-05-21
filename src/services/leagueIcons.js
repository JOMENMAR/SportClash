// Catálogo de iconos (deportes) para ligas.
// Guardamos en Firestore un `iconKey` (string). El UI lo traduce a Heroicons.

import {
  AcademicCapIcon,
  ArrowPathIcon,
  BoltIcon,
  FireIcon,
  GlobeAltIcon,
  HeartIcon,
  LifebuoyIcon,
  MapIcon,
  MusicalNoteIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/solid";

export const LEAGUE_ICON_OPTIONS = [
  { key: "weights", label: "Gym / Pesas", icon: ScaleIcon },
  { key: "running", label: "Running", icon: BoltIcon },
  { key: "cycling", label: "Ciclismo", icon: ArrowPathIcon },
  { key: "swimming", label: "Natación", icon: LifebuoyIcon },
  { key: "yoga", label: "Yoga", icon: SparklesIcon },
  { key: "pilates", label: "Pilates", icon: HeartIcon },
  { key: "crossfit", label: "CrossFit", icon: FireIcon },
  { key: "boxing", label: "Boxeo", icon: ShieldCheckIcon },
  { key: "martial", label: "Artes marciales", icon: ShieldCheckIcon },
  { key: "soccer", label: "Fútbol", icon: GlobeAltIcon },
  { key: "basketball", label: "Baloncesto", icon: UserGroupIcon },
  { key: "tennis", label: "Tenis", icon: BoltIcon },
  { key: "padel", label: "Pádel", icon: BoltIcon },
  { key: "volleyball", label: "Voleibol", icon: UserGroupIcon },
  { key: "handball", label: "Balonmano", icon: UserGroupIcon },
  { key: "baseball", label: "Béisbol", icon: BoltIcon },
  { key: "rugby", label: "Rugby", icon: ShieldCheckIcon },
  { key: "football", label: "Fútbol americano", icon: ShieldCheckIcon },
  { key: "golf", label: "Golf", icon: MapIcon },
  { key: "tabletennis", label: "Ping pong", icon: BoltIcon },
  { key: "badminton", label: "Bádminton", icon: BoltIcon },
  { key: "dance", label: "Baile", icon: MusicalNoteIcon },
  { key: "hiking", label: "Senderismo", icon: MapIcon },
  { key: "climbing", label: "Escalada", icon: MapIcon },
  { key: "ski", label: "Esquí", icon: MapIcon },
  { key: "skate", label: "Skate", icon: BoltIcon },
  { key: "row", label: "Remo", icon: ArrowPathIcon },
  { key: "surf", label: "Surf", icon: LifebuoyIcon },
  { key: "waterpolo", label: "Waterpolo", icon: LifebuoyIcon },
  { key: "triathlon", label: "Triatlón", icon: AcademicCapIcon },
  { key: "medal", label: "Competición", icon: TrophyIcon },
  { key: "trophy", label: "Torneo", icon: TrophyIcon },
];

const ICON_BY_KEY = LEAGUE_ICON_OPTIONS.reduce((acc, it) => {
  acc[it.key] = it;
  return acc;
}, {});

export function isLeagueIconKey(iconKey) {
  const k = String(iconKey || "").trim();
  if (!k) return false;
  return Boolean(ICON_BY_KEY[k]);
}

export function leagueIconComponent(iconKey) {
  const k = String(iconKey || "").trim();
  return ICON_BY_KEY[k]?.icon || null;
}

export function leagueInitial(name) {
  const s = String(name || "").trim();
  if (!s) return "";
  return s.slice(0, 1).toUpperCase();
}

export function leagueBadgeText({ name, iconKey } = {}) {
  return leagueInitial(name);
}

export function leagueBadgeSpec({ name, iconKey } = {}) {
  const icon = leagueIconComponent(iconKey);
  if (icon) return { kind: "icon", icon, text: "" };
  return { kind: "text", icon: null, text: leagueInitial(name) };
}
