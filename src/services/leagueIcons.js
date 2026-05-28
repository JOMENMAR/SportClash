// Catálogo de iconos (deportes) para ligas.
// Guardamos en Firestore un `iconKey` (string). El UI lo traduce a un componente Vue.

import {
  IconAward,
  IconBallAmericanFootball,
  IconBallBaseball,
  IconBallBasketball,
  IconBallFootball,
  IconBallTennis,
  IconBallVolleyball,
  IconBarbell,
  IconBike,
  IconCrown,
  IconDumbbell,
  IconGolf,
  IconKarate,
  IconMedal,
  IconPingPong,
  IconPlayHandball,
  IconPodium,
  IconRun,
  IconRugby,
  IconSkateboarding,
  IconStretching,
  IconSwimming,
  IconTarget,
  IconTrekking,
  IconTrophy,
  IconWaterpolo,
  IconYoga,
} from "@tabler/icons-vue";

import BadmintonShuttleIcon from "../components/icons/BadmintonShuttleIcon.vue";
import BoxingGloveIcon from "../components/icons/BoxingGloveIcon.vue";
import ClimbingIcon from "../components/icons/ClimbingIcon.vue";
import DanceIcon from "../components/icons/DanceIcon.vue";
import PadelRacketIcon from "../components/icons/PadelRacketIcon.vue";
import RowingBoatIcon from "../components/icons/RowingBoatIcon.vue";
import SkiIcon from "../components/icons/SkiIcon.vue";
import SurfboardWaveIcon from "../components/icons/SurfboardWaveIcon.vue";
import TriathlonIcon from "../components/icons/TriathlonIcon.vue";

export const LEAGUE_ICON_OPTIONS = [
  { key: "weights", label: "Gym / Pesas", icon: IconBarbell },
  { key: "running", label: "Running", icon: IconRun },
  { key: "cycling", label: "Ciclismo", icon: IconBike },
  { key: "swimming", label: "Natación", icon: IconSwimming },
  { key: "yoga", label: "Yoga", icon: IconYoga },
  { key: "pilates", label: "Pilates", icon: IconStretching },
  { key: "crossfit", label: "CrossFit", icon: IconDumbbell },
  { key: "boxing", label: "Boxeo", icon: BoxingGloveIcon },
  { key: "martial", label: "Artes marciales", icon: IconKarate },
  { key: "soccer", label: "Fútbol", icon: IconBallFootball },
  { key: "basketball", label: "Baloncesto", icon: IconBallBasketball },
  { key: "tennis", label: "Tenis", icon: IconBallTennis },
  { key: "padel", label: "Pádel", icon: PadelRacketIcon },
  { key: "volleyball", label: "Voleibol", icon: IconBallVolleyball },
  { key: "handball", label: "Balonmano", icon: IconPlayHandball },
  { key: "baseball", label: "Béisbol", icon: IconBallBaseball },
  { key: "rugby", label: "Rugby", icon: IconRugby },
  {
    key: "football",
    label: "Fútbol americano",
    icon: IconBallAmericanFootball,
  },
  { key: "golf", label: "Golf", icon: IconGolf },
  { key: "tabletennis", label: "Ping pong", icon: IconPingPong },
  { key: "badminton", label: "Bádminton", icon: BadmintonShuttleIcon },
  { key: "dance", label: "Baile", icon: DanceIcon },
  { key: "hiking", label: "Senderismo", icon: IconTrekking },
  { key: "climbing", label: "Escalada", icon: ClimbingIcon },
  { key: "ski", label: "Esquí", icon: SkiIcon },
  { key: "skate", label: "Skate", icon: IconSkateboarding },
  { key: "row", label: "Remo", icon: RowingBoatIcon },
  { key: "surf", label: "Surf", icon: SurfboardWaveIcon },
  { key: "waterpolo", label: "Waterpolo", icon: IconWaterpolo },
  { key: "triathlon", label: "Triatlón", icon: TriathlonIcon },

  // No-deporte / genéricos
  { key: "podium", label: "Podio", icon: IconPodium },
  { key: "award", label: "Premio", icon: IconAward },
  { key: "crown", label: "Élite", icon: IconCrown },
  { key: "target", label: "Reto / Objetivo", icon: IconTarget },
  { key: "medal", label: "Competición", icon: IconMedal },
  { key: "trophy", label: "Torneo", icon: IconTrophy },
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
