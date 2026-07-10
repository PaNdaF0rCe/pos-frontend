import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { createBatch } from "../../db/mutations/batchMutate";
import { Item } from "../../types/Item.type";

export default function AddStockModal({
  isOpen,
  setIsOpen,
  item,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  item: Item;
}) {
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState(String(item.price));
  const [submitting, setSubmitting] = useState(false);

  const parsedQty = parseInt(qty);
  const parsedPrice = parseFloat(price);
  const priceChanged = parsedPrice > 0 && parsedPrice !== item.price;

  function closeModal() {
    setQty("");
    setPrice(String(item.price));
    setIsOpen(false);
  }

  async function handleSubmit() {
    if (!parsedQty || parsedQty <= 0 || !parsedPrice || parsedPrice <= 0) return;
    setSubmitting(true);
    await createBatch(item.id!, item.name, parsedPrice, parsedQty, item.stock, Date.now());
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
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">
                  Add stock — {item.name}
                </Dialog.Title>
                <p className="text-xs text-neutral-500 mt-1">
                  Current stock: {item.stock} @ Rs. {item.price.toLocaleString()}
                </p>

                <div className="mt-4">
                  <label className="block font-semibold text-neutral-500 text-sm">
                    Quantity to add
                  </label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="Enter quantity"
                    className="border rounded-lg w-full outline-purple-400 px-3 py-2 text-lg font-bold mt-1"
                    autoFocus
                  />
                </div>

                <div className="mt-3">
                  <label className="block font-semibold text-neutral-500 text-sm">
                    Price for this batch
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                    className="border rounded-lg w-full outline-purple-400 px-3 py-2 text-lg font-bold mt-1"
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    Existing stock keeps selling at its own price first — this only
                    applies once older stock runs out.
                  </p>
                </div>

                {parsedQty > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    New total stock will be {item.stock + parsedQty}
                    {priceChanged &&
                      ` — the new ${parsedQty} unit${parsedQty === 1 ? "" : "s"} will sell at Rs. ${parsedPrice.toLocaleString()} once current stock is gone`}
                  </p>
                )}

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={submitting || !parsedQty || parsedQty <= 0 || !parsedPrice || parsedPrice <= 0}
                    className="flex mx-auto disabled:cursor-not-allowed disabled:opacity-40 justify-center rounded-md border border-transparent bg-purple-400 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 focus:outline-none"
                    onClick={handleSubmit}
                  >
                    {submitting ? "Adding..." : "Add Stock"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
