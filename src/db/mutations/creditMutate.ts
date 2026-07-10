import { push, ref, update } from "firebase/database";
import { firebaseDB } from "../database";
import { Person } from "../../types/Person.type";
import { CreditEntry } from "../../types/CreditEntry.type";
import { OrderItem } from "../../types/Order.type";
import { StockMovement } from "../../types/StockMovement.type";
import { StockBatch } from "../../types/StockBatch.type";
import { applyBatchConsumption, reverseToBatch } from "./batchMutate";

export function addPerson(name: string, note?: string) {
  const updates: Record<string, any> = {};

  const person: Person = {
    name,
    createdAt: Date.now(),
    ...(note ? { note } : {}),
  };

  const key = push(ref(firebaseDB, "people"), person).key;
  updates[`people/${key}/id`] = key;

  return update(ref(firebaseDB), updates);
}

export function deletePerson(personId: string, entryIds: string[]) {
  const updates: Record<string, any> = {};
  updates[`people/${personId}`] = null;
  for (const id of entryIds) {
    updates[`creditEntries/${id}`] = null;
  }
  return update(ref(firebaseDB), updates);
}

export async function addCharge(
  personId: string,
  items: OrderItem[],
  amount: number,
  stockMap: Record<string, number>,
  batches: StockBatch[],
  timestamp: number,
  note?: string
) {
  const entry: CreditEntry = {
    personId,
    type: "charge",
    items,
    amount,
    timestamp,
    ...(note ? { note } : {}),
  };

  const key = push(ref(firebaseDB, "creditEntries"), entry).key;
  const updates: Record<string, any> = {};
  updates[`creditEntries/${key}/id`] = key;

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
      type: "credit",
      delta: -item.qty,
      timestamp,
    };
    updates[`stockMovements/${moveKey}`] = movement;
  }

  await update(ref(firebaseDB), updates);
  return key;
}

export function addPayment(
  personId: string,
  amount: number,
  method: "cash" | "card",
  timestamp: number,
  note?: string
) {
  const entry: CreditEntry = {
    personId,
    type: "payment",
    amount,
    method,
    timestamp,
    ...(note ? { note } : {}),
  };

  const key = push(ref(firebaseDB, "creditEntries"), entry).key;
  const updates: Record<string, any> = {};
  updates[`creditEntries/${key}/id`] = key;

  return update(ref(firebaseDB), updates);
}

export async function deleteCreditEntry(
  entry: CreditEntry,
  stockMap: Record<string, number>,
  batches: StockBatch[]
) {
  const updates: Record<string, any> = {};
  updates[`creditEntries/${entry.id}`] = null;

  if (entry.type === "charge" && entry.items) {
    for (const item of entry.items) {
      const current = stockMap[item.itemId] ?? 0;
      updates[`items/${item.itemId}/stock`] = current + item.qty;
      reverseToBatch(updates, batches, item.itemId, item.price, item.qty, entry.timestamp);

      const moveKey = push(ref(firebaseDB, "stockMovements")).key;
      const movement: StockMovement = {
        id: moveKey!,
        itemId: item.itemId,
        itemName: item.name,
        type: "adjustment",
        delta: item.qty,
        timestamp: Date.now(),
        note: "Reversed deleted credit charge",
      };
      updates[`stockMovements/${moveKey}`] = movement;
    }
  }

  await update(ref(firebaseDB), updates);
}
