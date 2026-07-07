import { push, ref, update } from "firebase/database";
import { firebaseDB } from "../database";
import { Order, OrderItem } from "../../types/Order.type";
import { StockMovement } from "../../types/StockMovement.type";

export async function placeOrder(
  items: OrderItem[],
  subtotal: number,
  paymentMethod: "cash" | "card",
  stockMap: Record<string, number>,
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

  for (const item of items) {
    const newStock = (stockMap[item.itemId] ?? 0) - item.qty;
    updates[`items/${item.itemId}/stock`] = Math.max(0, newStock);

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
