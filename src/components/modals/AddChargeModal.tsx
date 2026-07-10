import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { IoAddOutline, IoRemoveOutline, IoSearchOutline } from "react-icons/io5";
import { AiOutlineLoading } from "react-icons/ai";
import { useListItems } from "../../db/hooks/dbHooks";
import { useListStockBatches } from "../../db/hooks/batchHooks";
import { addCharge } from "../../db/mutations/creditMutate";
import { Person } from "../../types/Person.type";
import { Item } from "../../types/Item.type";
import { OrderItem } from "../../types/Order.type";
import { addUnitToCart, nextUnitPrice, reservedQtyForItem } from "../../lib/cartPricing";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddChargeModal({
  isOpen,
  setIsOpen,
  person,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  person: Person;
}) {
  const [items, itemsLoading] = useListItems();
  const [batches] = useListStockBatches();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [date, setDate] = useState(todayInput());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredItems = (items ?? []).filter((i) =>
    i.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const total = cart.reduce((sum, e) => sum + e.total, 0);

  function addToCart(item: Item) {
    setCart((prev) => addUnitToCart(prev, item, batches ?? []));
  }

  function incrementLine(itemId: string) {
    const item = (items ?? []).find((i) => i.id === itemId);
    if (!item) return;
    setCart((prev) => addUnitToCart(prev, item, batches ?? []));
  }

  function decrementLine(itemId: string, price: number) {
    setCart((prev) =>
      prev
        .map((e) =>
          e.itemId === itemId && e.price === price
            ? { ...e, qty: e.qty - 1, total: (e.qty - 1) * price }
            : e
        )
        .filter((e) => e.qty > 0)
    );
  }

  function closeModal() {
    setCart([]);
    setSearch("");
    setNote("");
    setDate(todayInput());
    setIsOpen(false);
  }

  async function handleSubmit() {
    if (cart.length === 0) return;
    setSubmitting(true);
    const stockMap: Record<string, number> = {};
    for (const item of items ?? []) {
      if (item.id) stockMap[item.id] = item.stock;
    }
    const timestamp = new Date(`${date}T12:00:00`).getTime();
    await addCharge(person.id!, cart, total, stockMap, batches ?? [], timestamp, note || undefined);
    setSubmitting(false);
    closeModal();
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">
                  Add items for {person.name}
                </Dialog.Title>

                <div className="mt-4 flex gap-4">
                  {/* Item picker */}
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="relative">
                      <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search items..."
                        className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-green-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-auto pr-1">
                      {itemsLoading ? (
                        <div className="col-span-full flex items-center justify-center py-8 animate-spin">
                          <AiOutlineLoading className="w-6 h-6" />
                        </div>
                      ) : filteredItems.length === 0 ? (
                        <p className="col-span-full text-neutral-400 text-sm text-center py-8">
                          No items found
                        </p>
                      ) : (
                        filteredItems.map((item) => {
                          const effectivePrice = nextUnitPrice(
                            batches ?? [],
                            item.id!,
                            reservedQtyForItem(cart, item.id!)
                          );
                          return (
                            <button
                              key={item.id}
                              onClick={() => addToCart(item)}
                              disabled={effectivePrice === null}
                              className="text-left border rounded-lg px-3 py-2 hover:bg-green-50 hover:border-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <p className="text-sm font-semibold truncate">{item.name}</p>
                              <p className="text-xs text-green-700 font-bold">
                                Rs. {(effectivePrice ?? item.price).toLocaleString()}
                              </p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Cart */}
                  <div className="w-64 flex flex-col gap-2 border-l pl-4">
                    <p className="text-sm font-semibold text-neutral-600">Items taken</p>
                    <div className="flex-1 overflow-auto space-y-2 max-h-56">
                      {cart.length === 0 ? (
                        <p className="text-neutral-400 text-xs text-center py-6">
                          Tap items to add
                        </p>
                      ) : (
                        cart.map((entry) => (
                          <div
                            key={`${entry.itemId}-${entry.price}`}
                            className="flex items-center gap-2 border rounded-lg px-2 py-1.5"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{entry.name}</p>
                              <p className="text-[11px] text-neutral-500">
                                Rs. {entry.price.toLocaleString()} × {entry.qty}
                              </p>
                            </div>
                            <button
                              onClick={() => decrementLine(entry.itemId, entry.price)}
                              className="w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center"
                            >
                              <IoRemoveOutline className="w-3 h-3" />
                            </button>
                            <span className="text-xs w-3 text-center">{entry.qty}</span>
                            <button
                              onClick={() => incrementLine(entry.itemId)}
                              className="w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center"
                            >
                              <IoAddOutline className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-500 text-xs text-left">
                        Date
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border rounded-lg w-full outline-green-400 px-2 py-1 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-500 text-xs text-left">
                        Note (optional)
                      </label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. office use"
                        className="border rounded-lg w-full outline-green-400 px-2 py-1 text-sm"
                      />
                    </div>

                    <div className="flex justify-between font-bold text-sm border-t pt-2">
                      <span>Total</span>
                      <span>Rs. {total.toLocaleString()}</span>
                    </div>

                    <button
                      disabled={cart.length === 0 || submitting}
                      onClick={handleSubmit}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-semibold"
                    >
                      {submitting ? "Saving..." : "Add to tab"}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
