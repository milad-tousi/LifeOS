export interface Goal {
  id: string;
  title: string;
  progress: number;
  target: number;
  status: "active" | "completed";
}
