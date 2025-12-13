export interface RailCar {
  id: string;
  carNumber: string;
  carType: string;
  confirmedAt?: string;
  confirmedBy?: string;
  status: "pending" | "confirmed" | "missing";
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
}