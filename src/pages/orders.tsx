import { useListOrders } from "../db/hooks/orderHooks";
import { useListCreditEntries, useListPeople } from "../db/hooks/creditHooks";
import { AiOutlineLoading } from "react-icons/ai";
import { MdOutlinePayment, MdOutlineLocalAtm, MdOutlineCreditCard } from "react-icons/md";
import { useState } from "react";
import { OrderItem } from "../types/Order.type";

type SaleMethod = "cash" | "card" | "credit";

type SaleRow = {
  id: string;
  timestamp: number;
  items: OrderItem[];
  subtotal: number;
  method: SaleMethod;
  personName?: string;
  cashReceived?: number;
  change?: number;
};

export default function OrdersPage() {
  const [orders, ordersLoading] = useListOrders();
  const [entries, entriesLoading] = useListCreditEntries();
  const [people, peopleLoading] = useListPeople();
  const [expanded, setExpanded] = useState<string | null>(null);

  const isLoading = ordersLoading || entriesLoading || peopleLoading;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full animate-spin">
        <AiOutlineLoading className="w-10 h-10" />
      </div>
    );

  const peopleMap = new Map((people ?? []).map((p) => [p.id, p.name]));

  const orderRows: SaleRow[] = (orders ?? []).map((o) => ({
    id: o.id!,
    timestamp: o.timestamp,
    items: o.items,
    subtotal: o.subtotal,
    method: o.paymentMethod,
    cashReceived: o.cashReceived,
    change: o.change,
  }));

  const creditRows: SaleRow[] = (entries ?? [])
    .filter((e) => e.type === "charge")
    .map((e) => ({
      id: e.id!,
      timestamp: e.timestamp,
      items: e.items ?? [],
      subtotal: e.amount,
      method: "credit",
      personName: peopleMap.get(e.personId) ?? "Unknown",
    }));

  const sorted = [...orderRows, ...creditRows].sort((a, b) => b.timestamp - a.timestamp);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRows = sorted.filter((r) => r.timestamp >= todayStart.getTime());
  const todayTotal = todayRows
    .filter((r) => r.method !== "credit")
    .reduce((s, r) => s + r.subtotal, 0);

  return (
    <div className="max-w-[850px] w-full rounded-lg p-4 pb-6 bg-white">
      <h2 className="text-black font-bold text-xl mb-4">Sales History</h2>

      {/* Today summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Today's Sales</p>
          <p className="text-2xl font-bold text-green-700">
            Rs. {todayTotal.toLocaleString()}
          </p>
          <p className="text-sm text-neutral-400">
            {todayRows.filter((r) => r.method !== "credit").length} orders
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Cash Today</p>
          <p className="text-2xl font-bold text-blue-700">
            Rs.{" "}
            {todayRows
              .filter((r) => r.method === "cash")
              .reduce((s, r) => s + r.subtotal, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Card Today</p>
          <p className="text-2xl font-bold text-purple-700">
            Rs.{" "}
            {todayRows
              .filter((r) => r.method === "card")
              .reduce((s, r) => s + r.subtotal, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Credit Today</p>
          <p className="text-2xl font-bold text-orange-700">
            Rs.{" "}
            {todayRows
              .filter((r) => r.method === "credit")
              .reduce((s, r) => s + r.subtotal, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Sale list */}
      <div className="space-y-2 overflow-auto max-h-[500px] pr-1">
        {sorted.length === 0 && (
          <p className="text-neutral-400 text-sm text-center py-8">
            No sales yet
          </p>
        )}
        {sorted.map((row) => (
          <SaleRowView
            key={row.id}
            row={row}
            expanded={expanded === row.id}
            onToggle={() => setExpanded(expanded === row.id ? null : row.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SaleRowView({
  row,
  expanded,
  onToggle,
}: {
  row: SaleRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const date = new Date(row.timestamp);
  return (
    <div
      className="border rounded-lg px-4 py-3 hover:bg-neutral-50 transition-colors cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">
            {date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}{" "}
            &nbsp;
            {date.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-xs text-neutral-400">
            {row.items.reduce((s, i) => s + i.qty, 0)} items
            {row.method === "credit" && row.personName ? ` — ${row.personName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ${
              row.method === "card"
                ? "bg-purple-100 text-purple-700"
                : row.method === "credit"
                ? "bg-orange-100 text-orange-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {row.method === "card" ? (
              <MdOutlinePayment className="w-3 h-3" />
            ) : row.method === "credit" ? (
              <MdOutlineCreditCard className="w-3 h-3" />
            ) : (
              <MdOutlineLocalAtm className="w-3 h-3" />
            )}
            {row.method === "card" ? "Card" : row.method === "credit" ? "Credit" : "Cash"}
          </span>
          <span className="font-bold text-green-700">
            Rs. {row.subtotal.toLocaleString()}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3 space-y-1">
          {row.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {item.name}{" "}
                <span className="text-neutral-400">× {item.qty}</span>
              </span>
              <span className="font-semibold">
                Rs. {item.total.toLocaleString()}
              </span>
            </div>
          ))}
          {row.method === "cash" && row.cashReceived !== undefined && (
            <div className="mt-2 pt-2 border-t flex justify-between text-sm text-neutral-500">
              <span>Cash received</span>
              <span>Rs. {row.cashReceived.toLocaleString()}</span>
            </div>
          )}
          {row.change !== undefined && (
            <div className="flex justify-between text-sm text-neutral-500">
              <span>Change given</span>
              <span>Rs. {row.change.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
