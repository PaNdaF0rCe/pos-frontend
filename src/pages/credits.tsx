import { useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { IoAddOutline, IoChevronDown, IoChevronUp, IoSearchOutline } from "react-icons/io5";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineLocalAtm } from "react-icons/md";
import { useListPeople, useListCreditEntries } from "../db/hooks/creditHooks";
import { addPerson } from "../db/mutations/creditMutate";
import { Person } from "../types/Person.type";
import AddChargeModal from "../components/modals/AddChargeModal";
import AddPaymentModal from "../components/modals/AddPaymentModal";
import DeletePersonModal from "../components/modals/DeletePersonModal";

export default function CreditsPage() {
  const [people, peopleLoading] = useListPeople();
  const [entries, entriesLoading] = useListCreditEntries();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chargeTarget, setChargeTarget] = useState<Person | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);

  const isLoading = peopleLoading || entriesLoading;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full animate-spin">
        <AiOutlineLoading className="w-10 h-10" />
      </div>
    );

  function entriesFor(personId: string) {
    return (entries ?? [])
      .filter((e) => e.personId === personId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  function balanceFor(personId: string) {
    return entriesFor(personId).reduce(
      (sum, e) => sum + (e.type === "charge" ? e.amount : -e.amount),
      0
    );
  }

  const filteredPeople = (people ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="max-w-[850px] w-full h-full flex flex-col rounded-lg p-4 pb-6 bg-white">
      <h2 className="text-black font-bold text-xl mb-4">Credits</h2>

      {/* Add person */}
      <div className="flex items-end gap-3 flex-wrap mb-4">
        <div>
          <label className="block font-semibold text-neutral-500 text-sm">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Office, John"
            className="border mt-1 text-sm rounded-lg outline-green-400 px-3 py-1.5"
            type="text"
          />
        </div>
        <div>
          <label className="block font-semibold text-neutral-500 text-sm">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. staff, office use"
            className="border mt-1 text-sm rounded-lg outline-green-400 px-3 py-1.5"
            type="text"
          />
        </div>
        <button
          disabled={!name.trim()}
          onClick={async () => {
            await addPerson(name.trim(), note.trim() || undefined);
            setName("");
            setNote("");
          }}
          className="rounded-lg group hover:bg-green-700 disabled:opacity-40 transition-colors h-8 px-4 gap-2 flex items-center justify-center bg-green-600"
        >
          <IoAddOutline className="w-5 h-5 text-white" />
          <p className="text-white font-semibold text-sm">Add Person</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people..."
          className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-green-400"
        />
      </div>

      {/* People list */}
      <div className="flex-1 overflow-auto space-y-2">
        {filteredPeople.length === 0 && (
          <p className="text-neutral-400 text-sm text-center py-8">No people yet</p>
        )}
        {filteredPeople.map((person) => {
          const balance = balanceFor(person.id!);
          const isExpanded = expanded === person.id;
          const history = entriesFor(person.id!);

          return (
            <div key={person.id} className="border rounded-lg">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50"
                onClick={() => setExpanded(isExpanded ? null : person.id!)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <IoChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <IoChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{person.name}</p>
                    {person.note && (
                      <p className="text-xs text-neutral-400">{person.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold text-sm ${
                      balance > 0 ? "text-red-600" : "text-green-700"
                    }`}
                  >
                    Rs. {balance.toLocaleString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChargeTarget(person);
                    }}
                    className="text-xs font-semibold px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200"
                  >
                    Add items
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPaymentTarget(person);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <MdOutlineLocalAtm className="w-3.5 h-3.5" />
                    Payment
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(person);
                    }}
                    className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center"
                  >
                    <FaRegTrashAlt className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-2">
                  {history.length === 0 ? (
                    <p className="text-neutral-400 text-xs text-center py-2">
                      No history yet
                    </p>
                  ) : (
                    history.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex justify-between items-start text-sm"
                      >
                        <div>
                          <p className="text-xs text-neutral-400">
                            {new Date(entry.timestamp).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          {entry.type === "charge" ? (
                            <p>
                              {entry.items
                                ?.map((i) => `${i.name} × ${i.qty}`)
                                .join(", ")}
                            </p>
                          ) : (
                            <p className="text-blue-700">
                              Payment{entry.note ? ` — ${entry.note}` : ""}
                            </p>
                          )}
                        </div>
                        <span
                          className={`font-semibold ${
                            entry.type === "charge" ? "text-red-600" : "text-blue-700"
                          }`}
                        >
                          {entry.type === "charge" ? "+" : "−"} Rs.{" "}
                          {entry.amount.toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {chargeTarget && (
        <AddChargeModal
          isOpen={!!chargeTarget}
          setIsOpen={(open) => !open && setChargeTarget(null)}
          person={chargeTarget}
        />
      )}
      {paymentTarget && (
        <AddPaymentModal
          isOpen={!!paymentTarget}
          setIsOpen={(open) => !open && setPaymentTarget(null)}
          person={paymentTarget}
          balance={balanceFor(paymentTarget.id!)}
        />
      )}
      {deleteTarget && (
        <DeletePersonModal
          isOpen={!!deleteTarget}
          setIsOpen={(open) => !open && setDeleteTarget(null)}
          selectedPerson={deleteTarget}
          entryIds={entriesFor(deleteTarget.id!).map((e) => e.id!)}
        />
      )}
    </div>
  );
}
