export type LeagueVisibility = "private" | "public";

export type LeagueItem = {
  leagueId: string;
  name: string;
  iconKey: string;
  visibility: LeagueVisibility;
  dailyPointsLimit: number;
  membersCount: number;
  createdAt: string;
  createdBy: string;
};

export type LeagueMemberItem = {
  leagueId: string;
  uid: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
};

export type JoinRequestItem = {
  leagueId: string;
  requestId: string;
  uid: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
};

export type PointRequestItem = {
  leagueId: string;
  requestId: string;
  uid: string;
  status: "pending" | "approved" | "rejected";
  points: 1;
  note?: string;
  performedOn: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  rejectReason?: string;
};

export type UserItem = {
  uid: string;
  ownedLeagueId?: string;
  // Perfil (opcional)
  nombre?: string;
  apodo?: string;
  fechaNacimiento?: string;
  status?: string;
  bio?: string;
  profileIconKey?: string;
  profileBanner?: string;
  profileAccent?: string;
  profileAccentHex?: string;
  profilePageBg?: string;
  profilePageBgHex?: string;
  profileCompleted?: boolean;
  profileCompletedAt?: string;
  updatedAt?: string;
};

export type ConnectionItem = {
  connectionId: string;
  leagueId?: string;
  uid: string;
  connectedAt: string;
};

export type LeagueHistoryItem = {
  leagueId: string;
  eventId: string;
  type: string;
  actorUid: string;
  payload: Record<string, unknown>;
  createdAt: string;
};
