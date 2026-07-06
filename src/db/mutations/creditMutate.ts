import { push, ref, update } from "firebase/database";
import { firebaseDB } from "../database";
import { Person } from "../../types/Person.type";
import { CreditEntry } from "../../types/CreditEntry.type";
import { OrderItem } from "../../types/Order.type";

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

  for (const item of items) {
    const newStock = (stockMap[item.itemId] ?? 0) - item.qty;
    updates[`items/${item.itemId}/stock`] = Math.max(0, newStock);
  }

  await update(ref(firebaseDB), updates);
  return key;
}

export function addPayment(
  personId: string,
  amount: number,
  timestamp: number,
  note?: string
) {
  const entry: CreditEntry = {
    personId,
    type: "payment",
    amount,
    timestamp,
    ...(note ? { note } : {}),
  };

  const key = push(ref(firebaseDB, "creditEntries"), entry).key;
  const updates: Record<string, any> = {};
  updates[`creditEntries/${key}/id`] = key;

  return update(ref(firebaseDB), updates);
}
