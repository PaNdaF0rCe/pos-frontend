import { push, ref, update } from "firebase/database";
import { firebaseDB } from "../database";
import { StockBatch } from "../../types/StockBatch.type";
import { StockMovement } from "../../types/StockMovement.type";
import { OrderItem } from "../../types/Order.type";

// Creates a restock batch at the given price, bumps the item's total stock
// and current price, and logs a "restock" stock movement — the full flow
// for adding new stock (optionally at a different price than before).
export function createBatch(
  itemId: string,
  itemName: string,
  price: number,
  qty: number,
  currentStock: number,
  timestamp: number
) {
  const updates: Record<string, any> = {};
  const key = push(ref(firebaseDB, "stockBatches")).key;
  const batch: StockBatch = { id: key!, itemId, price, qty, createdAt: timestamp };
  updates[`stockBatches/${key}`] = batch;
  updates[`items/${itemId}/stock`] = currentStock + qty;
  updates[`items/${itemId}/price`] = price;

  const moveKey = push(ref(firebaseDB, "stockMovements")).key;
  const movement: StockMovement = {
    id: moveKey!,
    itemId,
    itemName,
    type: "restock",
    delta: qty,
    timestamp,
  };
  updates[`stockMovements/${moveKey}`] = movement;

  return update(ref(firebaseDB), updates);
}

// Mutates `updates` to decrement (or delete) whichever batch documents cover
// the given cart lines, matching each line's price to same-priced batches,
// oldest first. Returns total qty consumed per itemId so the caller can also
// update items/{id}/stock in the same atomic write.
export function applyBatchConsumption(
  updates: Record<string, any>,
  batches: StockBatch[],
  items: OrderItem[]
): Record<string, number> {
  const qtyByItem: Record<string, number> = {};
  const remainingByBatchId = new Map(batches.map((b) => [b.id!, b.qty]));

  for (const line of items) {
    qtyByItem[line.itemId] = (qtyByItem[line.itemId] ?? 0) + line.qty;

    const candidates = batches
      .filter((b) => b.itemId === line.itemId && b.price === line.price)
      .sort((a, b) => a.createdAt - b.createdAt);

    let remaining = line.qty;
    for (const batch of candidates) {
      if (remaining <= 0) break;
      const available = remainingByBatchId.get(batch.id!) ?? 0;
      if (available <= 0) continue;
      const take = Math.min(available, remaining);
      const newQty = available - take;
      remainingByBatchId.set(batch.id!, newQty);
      remaining -= take;
      updates[`stockBatches/${batch.id}`] = newQty > 0 ? { ...batch, qty: newQty } : null;
    }
  }

  return qtyByItem;
}

// Restores a previously-consumed quantity back into a batch at the given
// price, used when a credit charge is deleted. Reuses an existing batch at
// that exact price if one still exists, otherwise creates a new one dated
// to the original sale so it slots back into FIFO order roughly where it
// came from.
export function reverseToBatch(
  updates: Record<string, any>,
  batches: StockBatch[],
  itemId: string,
  price: number,
  qty: number,
  originalTimestamp: number
) {
  const existing = batches.find((b) => b.itemId === itemId && b.price === price);
  if (existing) {
    updates[`stockBatches/${existing.id}`] = { ...existing, qty: existing.qty + qty };
  } else {
    const key = push(ref(firebaseDB, "stockBatches")).key;
    const batch: StockBatch = { id: key!, itemId, price, qty, createdAt: originalTimestamp };
    updates[`stockBatches/${key}`] = batch;
  }
}

// Manual stock corrections (editing the Stock field directly) don't go
// through the cart/checkout flow, so they adjust batches directly: growing
// the newest batch (or creating one at the item's current price) on
// increase, and shrinking the newest batches first on decrease.
export function adjustBatchesForManualEdit(
  updates: Record<string, any>,
  batches: StockBatch[],
  itemId: string,
  price: number,
  delta: number,
  timestamp: number
) {
  if (delta === 0) return;
  const itemBatches = batches
    .filter((b) => b.itemId === itemId)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (delta > 0) {
    const newest = itemBatches[0];
    if (newest && newest.price === price) {
      updates[`stockBatches/${newest.id}`] = { ...newest, qty: newest.qty + delta };
    } else {
      const key = push(ref(firebaseDB, "stockBatches")).key;
      const batch: StockBatch = { id: key!, itemId, price, qty: delta, createdAt: timestamp };
      updates[`stockBatches/${key}`] = batch;
    }
    return;
  }

  let remaining = -delta;
  for (const batch of itemBatches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.qty, remaining);
    const newQty = batch.qty - take;
    updates[`stockBatches/${batch.id}`] = newQty > 0 ? { ...batch, qty: newQty } : null;
    remaining -= take;
  }
}

export function deleteBatchesForItem(updates: Record<string, any>, batches: StockBatch[], itemId: string) {
  for (const b of batches) {
    if (b.itemId === itemId) updates[`stockBatches/${b.id}`] = null;
  }
}

// One-time backfill: any item with stock but no batch record yet gets a
// single legacy batch at its current price, dated first (createdAt: 0) so
// it sells before anything restocked afterward.
export function migrateLegacyStock(
  items: { id?: string; price: number; stock: number }[],
  batches: StockBatch[]
) {
  const itemsWithBatches = new Set(batches.map((b) => b.itemId));
  const updates: Record<string, any> = {};
  let count = 0;
  for (const item of items) {
    if (!item.id || item.stock <= 0 || itemsWithBatches.has(item.id)) continue;
    const key = push(ref(firebaseDB, "stockBatches")).key;
    const batch: StockBatch = {
      id: key!,
      itemId: item.id,
      price: item.price,
      qty: item.stock,
      createdAt: 0,
    };
    updates[`stockBatches/${key}`] = batch;
    count += 1;
  }
  if (count === 0) return Promise.resolve(0);
  return update(ref(firebaseDB), updates).then(() => count);
}
