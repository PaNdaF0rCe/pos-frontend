import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { addStock } from "../../db/mutations/itemMutate";
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
  const [submitting, setSubmitting] = useState(false);

  const parsedQty = parseInt(qty);

  function closeModal() {
    setQty("");
    setIsOpen(false);
  }

  async function handleSubmit() {
    if (!parsedQty || parsedQty <= 0) return;
    setSubmitting(true);
    await addStock(item.id!, item.name, item.stock, parsedQty);
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
                  Current stock: {item.stock}
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
                  {parsedQty > 0 && (
                    <p className="text-xs text-neutral-500 mt-1">
                      New stock will be {item.stock + parsedQty}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={submitting || !parsedQty || parsedQty <= 0}
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
