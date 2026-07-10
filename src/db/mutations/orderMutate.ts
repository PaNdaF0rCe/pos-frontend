import { push, ref, update } from "firebase/database";
import { firebaseDB } from "../database";
import { Order, OrderItem } from "../../types/Order.type";
import { StockMovement } from "../../types/StockMovement.type";
import { StockBatch } from "../../types/StockBatch.type";
import { applyBatchConsumption } from "./batchMutate";

export async function placeOrder(
  items: OrderItem[],
  subtotal: number,
  paymentMethod: "cash" | "card",
  stockMap: Record<string, number>,
  batches: StockBatch[],
  cashReceived?: number
) {
  const timestamp = Date.now();
  const order: Order = {
    orderNumber: timestamp,
    items,
    subtotal,
    paymentMethod,
    timestamp,
    ...(paymentMethod === "cash" && cashReceived !== undefined
      ? { cashReceived, change: cashReceived - subtotal }
      : {}),
  };

  const key = push(ref(firebaseDB, "orders"), order).key;
  const updates: Record<string, any> = {};
  updates[`orders/${key}/id`] = key;

  const qtyByItem = applyBatchConsumption(updates, batches, items);
  for (const [itemId, qty] of Object.entries(qtyByItem)) {
    const newStock = (stockMap[itemId] ?? 0) - qty;
    updates[`items/${itemId}/stock`] = Math.max(0, newStock);
  }

  for (const item of items) {
    const moveKey = push(ref(firebaseDB, "stockMovements")).key;
    const movement: StockMovement = {
      id: moveKey!,
      itemId: item.itemId,
      itemName: item.name,
      type: "sale",
      delta: -item.qty,
      timestamp,
    };
    updates[`stockMovements/${moveKey}`] = movement;
  }

  await update(ref(firebaseDB), updates);
  return key;
}
