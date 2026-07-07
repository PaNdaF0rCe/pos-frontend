export type StockMovementType = "sale" | "credit" | "restock" | "adjustment";

export type StockMovement = {
  id?: string;
  itemId: string;
  itemName: string;
  type: StockMovementType;
  delta: number;
  timestamp: number;
  note?: string;
};
