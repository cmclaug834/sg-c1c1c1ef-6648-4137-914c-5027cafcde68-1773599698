export interface RailCar {
  id: string;
  carNumber: string;
  carType: string;
  tankType?: "C" | "A" | "HP" | "SC";
  confirmedAt?: string;
  confirmedBy?: string;
  status: "pending" | "confirmed" | "missing";
}

export interface MoveLog {
  id: string;
  carId: string;
  carNumber: string;
  fromTrack: string;
  toTrack: string;
  timestamp: string;
  crewId: string;
  reason: "MORNING_RECONCILE" | "DAY_MOVE";
}

export interface Track {
  id: string;
  name: string;
  displayName?: string;
  cars: RailCar[];
  lastChecked?: string;
  lastCheckClearedAt?: string;
  enabled?: boolean;
}

export interface User {
  crewName: string;
  crewId: string;
  timestamp: string;
}

export interface AppSettings {
  requireUnconfirmDialog: boolean;
  resolveOnDone?: boolean;
  showMissingInList?: boolean;
  movePlacement?: "append" | "prepend";
  adminManageTracks?: boolean;
  shiftChangeA?: string;
  shiftChangeB?: string;
}