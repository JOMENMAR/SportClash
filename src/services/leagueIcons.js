// Catálogo de iconos (deportes) para ligas.
// Guardamos en Firestore un `iconKey` (string). El UI lo traduce a emoji.

export const LEAGUE_ICON_OPTIONS = [
  { key: "weights", label: "Gym / Pesas", emoji: "🏋️" },
  { key: "running", label: "Running", emoji: "🏃" },
  { key: "cycling", label: "Ciclismo", emoji: "🚴" },
  { key: "swimming", label: "Natación", emoji: "🏊" },
  { key: "yoga", label: "Yoga", emoji: "🧘" },
  { key: "pilates", label: "Pilates", emoji: "🤸" },
  { key: "crossfit", label: "CrossFit", emoji: "🏋️‍♀️" },
  { key: "boxing", label: "Boxeo", emoji: "🥊" },
  { key: "martial", label: "Artes marciales", emoji: "🥋" },
  { key: "soccer", label: "Fútbol", emoji: "⚽" },
  { key: "basketball", label: "Baloncesto", emoji: "🏀" },
  { key: "tennis", label: "Tenis", emoji: "🎾" },
  { key: "padel", label: "Pádel", emoji: "🎾" },
  { key: "volleyball", label: "Voleibol", emoji: "🏐" },
  { key: "handball", label: "Balonmano", emoji: "🤾" },
  { key: "baseball", label: "Béisbol", emoji: "⚾" },
  { key: "rugby", label: "Rugby", emoji: "🏉" },
  { key: "football", label: "Fútbol americano", emoji: "🏈" },
  { key: "golf", label: "Golf", emoji: "⛳" },
  { key: "tabletennis", label: "Ping pong", emoji: "🏓" },
  { key: "badminton", label: "Bádminton", emoji: "🏸" },
  { key: "dance", label: "Baile", emoji: "💃" },
  { key: "hiking", label: "Senderismo", emoji: "🥾" },
  { key: "climbing", label: "Escalada", emoji: "🧗" },
  { key: "ski", label: "Esquí", emoji: "⛷️" },
  { key: "skate", label: "Skate", emoji: "🛹" },
  { key: "row", label: "Remo", emoji: "🚣" },
  { key: "surf", label: "Surf", emoji: "🏄" },
  { key: "waterpolo", label: "Waterpolo", emoji: "🤽" },
  { key: "triathlon", label: "Triatlón", emoji: "🏊‍♂️" },
  { key: "medal", label: "Competición", emoji: "🏅" },
  { key: "trophy", label: "Torneo", emoji: "🏆" },
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

export function leagueIconEmoji(iconKey) {
  const k = String(iconKey || "").trim();
  return ICON_BY_KEY[k]?.emoji || "";
}

export function leagueInitial(name) {
  const s = String(name || "").trim();
  if (!s) return "";
  return s.slice(0, 1).toUpperCase();
}

export function leagueBadgeText({ name, iconKey } = {}) {
  const emoji = leagueIconEmoji(iconKey);
  if (emoji) return emoji;
  return leagueInitial(name);
}
