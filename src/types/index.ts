export interface RailCar {
  id: string;
  carNumber: string;
  carType: string;
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
  cars: RailCar[];
  totalCars: number;
  confirmedCars: number;
  lastChecked?: string;
  enabled?: boolean;
}

export interface User {
  id: string;
  name: string;
  crewId: string;
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