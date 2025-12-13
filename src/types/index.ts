export interface RailCar {
  id: string;
  carNumber: string;
  carType: string;
  confirmedAt?: string;
  confirmedBy?: string;
  status: "pending" | "confirmed";
}

export interface Track {
  id: string;
  name: string;
  cars: RailCar[];
  totalCars: number;
  confirmedCars: number;
  lastChecked?: string;
}

export interface User {
  id: string;
  name: string;
  crewId: string;
}