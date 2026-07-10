import { push, ref, update } from "firebase/database";
import { Item } from "../../types/Item.type";
import { StockMovement } from "../../types/StockMovement.type";
import { StockBatch } from "../../types/StockBatch.type";
import { firebaseDB } from "../database";
import { adjustBatchesForManualEdit, deleteBatchesForItem } from "./batchMutate";

export function addItem(
  name: string,
  category: string,
  price: number,
  stock: number,
  options: boolean,
  batches: StockBatch[],
  itemId?: string,
  previousStock?: number
) {
  const updates: Record<string, any> = {};

  const item: Item = {
    name,
    category,
    price,
    stock,
    options,
  };

  if (itemId) {
    updates[`items/${itemId}/name`] = name;
    updates[`items/${itemId}/category`] = category;
    updates[`items/${itemId}/price`] = price;
    updates[`items/${itemId}/stock`] = stock;
    updates[`items/${itemId}/options`] = options;

    const delta = stock - (previousStock ?? stock);
    if (delta !== 0) {
      adjustBatchesForManualEdit(updates, batches, itemId, price, delta, Date.now());

      const moveKey = push(ref(firebaseDB, "stockMovements")).key;
      const movement: StockMovement = {
        id: moveKey!,
        itemId,
        itemName: name,
        type: "adjustment",
        delta,
        timestamp: Date.now(),
      };
      updates[`stockMovements/${moveKey}`] = movement;
    }
  } else {
    const key = push(ref(firebaseDB, "items"), item).key;
    updates[`items/${key}/id`] = key;

    if (stock > 0) {
      const batchKey = push(ref(firebaseDB, "stockBatches")).key;
      const batch: StockBatch = {
        id: batchKey!,
        itemId: key!,
        price,
        qty: stock,
        createdAt: Date.now(),
      };
      updates[`stockBatches/${batchKey}`] = batch;
    }
  }

  return update(ref(firebaseDB), updates);
}

export function deleteItem(itemId: string, batches: StockBatch[]) {
  const updates: Record<string, any> = {};
  updates[`items/${itemId}`] = null;
  deleteBatchesForItem(updates, batches, itemId);
  return update(ref(firebaseDB), updates);
}
