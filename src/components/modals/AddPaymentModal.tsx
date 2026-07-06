import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { addPayment } from "../../db/mutations/creditMutate";
import { Person } from "../../types/Person.type";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddPaymentModal({
  isOpen,
  setIsOpen,
  person,
  balance,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  person: Person;
  balance: number;
}) {
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState(todayInput());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amt = parseFloat(amount) || 0;

  function closeModal() {
    setAmount("");
    setNote("");
    setDate(todayInput());
    setIsOpen(false);
  }

  async function handleSubmit() {
    if (amt <= 0) return;
    setSubmitting(true);
    const timestamp = new Date(`${date}T12:00:00`).getTime();
    await addPayment(person.id!, amt, timestamp, note || undefined);
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
                  Record payment from {person.name}
                </Dialog.Title>
                <p className="text-xs text-neutral-500 mt-1">
                  Current balance: Rs. {balance.toLocaleString()}
                </p>

                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-500 text-sm">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="border rounded-lg w-full outline-green-400 px-3 py-2 text-lg font-bold"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-500 text-sm">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="border rounded-lg w-full outline-green-400 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-500 text-sm">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. paid cash"
                      className="border rounded-lg w-full outline-green-400 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={submitting || amt <= 0}
                    className="flex mx-auto disabled:cursor-not-allowed disabled:opacity-40 mt-2 justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none"
                    onClick={handleSubmit}
                  >
                    {submitting ? "Saving..." : "Record Payment"}
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
