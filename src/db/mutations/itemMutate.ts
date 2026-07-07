import { push, ref, update, remove } from "firebase/database";
import { Item } from "../../types/Item.type";
import { firebaseDB } from "../database";

export function addItem(
  name: string,
  category: string,
  price: number,
  stock: number,
  options: boolean,
  itemId?: string
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
  } else {
    const key = push(ref(firebaseDB, "items"), item).key;
    updates[`items/${key}/id`] = key;
  }

  return update(ref(firebaseDB), updates);
}

export function deleteItem(itemId: string) {
  return remove(ref(firebaseDB, `/items/${itemId}`));
}

export function addStock(itemId: string, currentStock: number, qty: number) {
  return update(ref(firebaseDB), {
    [`items/${itemId}/stock`]: currentStock + qty,
  });
}
