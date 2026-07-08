import { OrderItem } from "./Order.type";

export type CreditEntry = {
  id?: string;
  personId: string;
  type: "charge" | "payment";
  items?: OrderItem[];
  amount: number;
  method?: "cash" | "card";
  note?: string;
  timestamp: number;
};
