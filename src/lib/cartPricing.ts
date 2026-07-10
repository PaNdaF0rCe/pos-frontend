import { Item } from "../types/Item.type";
import { OrderItem } from "../types/Order.type";
import { StockBatch } from "../types/StockBatch.type";

export function batchesForItem(batches: StockBatch[], itemId: string): StockBatch[] {
  return batches
    .filter((b) => b.itemId === itemId && b.qty > 0)
    .sort((a, b) => a.createdAt - b.createdAt);
}

// Given how many units of this item are already reserved (e.g. already in the
// cart), returns the price the *next* unit would be sold at, walking batches
// oldest-first. Returns null if there isn't enough stock left.
export function nextUnitPrice(
  batches: StockBatch[],
  itemId: string,
  reservedQty: number
): number | null {
  let skip = reservedQty;
  for (const batch of batchesForItem(batches, itemId)) {
    if (skip < batch.qty) return batch.price;
    skip -= batch.qty;
  }
  return null;
}

export function reservedQtyForItem(cart: OrderItem[], itemId: string): number {
  return cart
    .filter((e) => e.itemId === itemId)
    .reduce((sum, e) => sum + e.qty, 0);
}

// Adds one unit of `item` to the cart, splitting into a separate cart line
// whenever the unit's price (per current batch availability) differs from an
// existing line for the same item. Returns the same cart if there's no stock
// left to allocate.
export function addUnitToCart(
  cart: OrderItem[],
  item: Item,
  batches: StockBatch[]
): OrderItem[] {
  const reserved = reservedQtyForItem(cart, item.id!);
  const price = nextUnitPrice(batches, item.id!, reserved);
  if (price === null) return cart;

  const existing = cart.find((e) => e.itemId === item.id && e.price === price);
  if (existing) {
    return cart.map((e) =>
      e === existing ? { ...e, qty: e.qty + 1, total: (e.qty + 1) * price } : e
    );
  }
  return [...cart, { itemId: item.id!, name: item.name, price, qty: 1, total: price }];
}

// Given a batch snapshot and a required qty for one item, returns the
// oldest-first allocation across batches. Used when committing a sale to
// decide exactly which batch document(s) to decrement.
export function allocateFifo(
  batches: StockBatch[],
  itemId: string,
  qty: number
): { batchId: string; qty: number }[] {
  const allocations: { batchId: string; qty: number }[] = [];
  let remaining = qty;
  for (const batch of batchesForItem(batches, itemId)) {
    if (remaining <= 0) break;
    const take = Math.min(batch.qty, remaining);
    allocations.push({ batchId: batch.id!, qty: take });
    remaining -= take;
  }
  return allocations;
}
