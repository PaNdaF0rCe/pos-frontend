import { push, ref, update } from "firebase/database";
import { firebaseDB } from "../database";
import { StockMovement, StockMovementType } from "../../types/StockMovement.type";

export function logStockMovement(
  itemId: string,
  itemName: string,
  type: StockMovementType,
  delta: number,
  timestamp: number,
  note?: string
) {
  const key = push(ref(firebaseDB, "stockMovements")).key;
  const movement: StockMovement = {
    id: key!,
    itemId,
    itemName,
    type,
    delta,
    timestamp,
    ...(note ? { note } : {}),
  };
  return update(ref(firebaseDB), {
    [`stockMovements/${key}`]: movement,
  });
}
