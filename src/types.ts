export type Decision = "accepted" | "declined";
export type OpeningPhase = "ready" | "offering" | "held" | "exhausted" | "closed" | "filled-manually";
export type WaitlistClient = { id: string; name: string; phone: string; service: string; stylist: string | "Any stylist"; availability: string; waitlistedAt: string; smsOptIn: boolean };
export type OpeningInput = { id: string; service: string; stylist: string; startsAt: string; latestArrivalAt: string; responseMinutes: number; candidates: WaitlistClient[] };
export type HistoryItem = { at: string; kind: "opened" | "offer-sent" | "accepted" | "declined" | "timed-out" | "closed" | "filled-manually"; text: string };
export type OpeningStatus = { opening: OpeningInput; phase: OpeningPhase; currentClient?: WaitlistClient; offerDeadline?: string; nextClient?: WaitlistClient; contactedIds: string[]; history: HistoryItem[]; heldFor?: WaitlistClient; reason?: string };
export type StaffAction = "close" | "filled-manually" | "choose-client";
