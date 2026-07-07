import { useMemo, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { useListOrders } from "../db/hooks/orderHooks";
import { useListStockMovements } from "../db/hooks/stockHooks";
import { Order } from "../types/Order.type";
import { StockMovement } from "../types/StockMovement.type";

type RangePreset = "today" | "week" | "month" | "lastMonth" | "custom";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function toDateInput(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function isoDay(ts: number) {
  return toDateInput(ts);
}

function presetLabel(p: RangePreset) {
  switch (p) {
    case "today":
      return "Today";
    case "week":
      return "This Week";
    case "month":
      return "This Month";
    case "lastMonth":
      return "Last Month";
    default:
      return "Custom";
  }
}

function pillClass(active: boolean) {
  return `px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
    active ? "bg-green-600 text-white" : "bg-neutral-100 hover:bg-neutral-200"
  }`;
}

export default function ReportsPage() {
  const [orders, ordersLoading] = useListOrders();
  const [movements, movementsLoading] = useListStockMovements();
  const [tab, setTab] = useState<"sales" | "stock">("sales");
  const [preset, setPreset] = useState<RangePreset>("month");

  const now = new Date();
  const [customStart, setCustomStart] = useState(toDateInput(startOfMonth(now).getTime()));
  const [customEnd, setCustomEnd] = useState(toDateInput(endOfDay(now).getTime()));

  const { rangeStart, rangeEnd } = useMemo(() => {
    const n = new Date();
    switch (preset) {
      case "today":
        return { rangeStart: startOfDay(n).getTime(), rangeEnd: endOfDay(n).getTime() };
      case "week":
        return { rangeStart: startOfWeek(n).getTime(), rangeEnd: endOfDay(n).getTime() };
      case "month":
        return { rangeStart: startOfMonth(n).getTime(), rangeEnd: endOfDay(n).getTime() };
      case "lastMonth": {
        const prev = new Date(n.getFullYear(), n.getMonth() - 1, 1);
        return { rangeStart: startOfMonth(prev).getTime(), rangeEnd: endOfMonth(prev).getTime() };
      }
      case "custom":
        return {
          rangeStart: new Date(`${customStart}T00:00:00`).getTime(),
          rangeEnd: new Date(`${customEnd}T23:59:59`).getTime(),
        };
    }
  }, [preset, customStart, customEnd]);

  const isLoading = ordersLoading || movementsLoading;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full animate-spin">
        <AiOutlineLoading className="w-10 h-10" />
      </div>
    );

  const filteredOrders = (orders ?? []).filter(
    (o) => o.timestamp >= rangeStart && o.timestamp <= rangeEnd
  );
  const filteredMovements = (movements ?? []).filter(
    (m) => m.timestamp >= rangeStart && m.timestamp <= rangeEnd
  );

  return (
    <div className="max-w-[900px] w-full h-full flex flex-col rounded-lg p-4 pb-6 bg-white">
      <h2 className="text-black font-bold text-xl mb-4">Reports</h2>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("sales")} className={pillClass(tab === "sales")}>
          Sales
        </button>
        <button onClick={() => setTab("stock")} className={pillClass(tab === "stock")}>
          Stock Movements
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-6">
        {(["today", "week", "month", "lastMonth"] as RangePreset[]).map((p) => (
          <button key={p} onClick={() => setPreset(p)} className={pillClass(preset === p)}>
            {presetLabel(p)}
          </button>
        ))}
        <button onClick={() => setPreset("custom")} className={pillClass(preset === "custom")}>
          Custom
        </button>
        {preset === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            />
            <span className="text-neutral-400 text-sm">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "sales" ? (
          <SalesReport orders={filteredOrders} />
        ) : (
          <StockReport movements={filteredMovements} />
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "green" | "blue" | "purple" | "neutral";
}) {
  const bg = {
    green: "bg-green-50 border-green-200 text-green-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    neutral: "bg-neutral-50 border-neutral-200 text-neutral-700",
  }[color];
  return (
    <div className={`border rounded-lg p-3 ${bg}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function SalesReport({ orders }: { orders: Order[] }) {
  const revenue = orders.reduce((s, o) => s + o.subtotal, 0);
  const cash = orders
    .filter((o) => o.paymentMethod === "cash")
    .reduce((s, o) => s + o.subtotal, 0);
  const card = orders
    .filter((o) => o.paymentMethod === "card")
    .reduce((s, o) => s + o.subtotal, 0);

  const byDay = new Map<string, { label: string; count: number; revenue: number }>();
  for (const o of orders) {
    const key = isoDay(o.timestamp);
    const entry = byDay.get(key) ?? {
      label: new Date(o.timestamp).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      count: 0,
      revenue: 0,
    };
    entry.count += 1;
    entry.revenue += o.subtotal;
    byDay.set(key, entry);
  }
  const dayRows = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const itemTotals = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      const entry = itemTotals.get(it.itemId) ?? { name: it.name, qty: 0, revenue: 0 };
      entry.qty += it.qty;
      entry.revenue += it.total;
      itemTotals.set(it.itemId, entry);
    }
  }
  const topItems = Array.from(itemTotals.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Revenue" value={`Rs. ${revenue.toLocaleString()}`} color="green" />
        <SummaryCard label="Orders" value={`${orders.length}`} color="neutral" />
        <SummaryCard label="Cash" value={`Rs. ${cash.toLocaleString()}`} color="blue" />
        <SummaryCard label="Card" value={`Rs. ${card.toLocaleString()}`} color="purple" />
      </div>

      <div>
        <h3 className="font-semibold text-sm text-neutral-600 mb-2">By day</h3>
        {dayRows.length === 0 ? (
          <p className="text-neutral-400 text-sm text-center py-6">No sales in this range</p>
        ) : (
          <div className="space-y-1 max-h-56 overflow-auto">
            {dayRows.map(([key, d]) => (
              <div key={key} className="flex justify-between text-sm border-b py-1.5">
                <span>{d.label}</span>
                <span className="text-neutral-400">{d.count} orders</span>
                <span className="font-semibold text-green-700">
                  Rs. {d.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-sm text-neutral-600 mb-2">Top items</h3>
        {topItems.length === 0 ? (
          <p className="text-neutral-400 text-sm text-center py-6">No sales in this range</p>
        ) : (
          <div className="space-y-1">
            {topItems.map((it) => (
              <div key={it.name} className="flex justify-between text-sm border-b py-1.5">
                <span>{it.name}</span>
                <span className="text-neutral-400">{it.qty} sold</span>
                <span className="font-semibold text-green-700">
                  Rs. {it.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StockReport({ movements }: { movements: StockMovement[] }) {
  const byItem = new Map<
    string,
    { name: string; sold: number; credited: number; restocked: number; adjusted: number; net: number }
  >();
  for (const m of movements) {
    const entry = byItem.get(m.itemId) ?? {
      name: m.itemName,
      sold: 0,
      credited: 0,
      restocked: 0,
      adjusted: 0,
      net: 0,
    };
    if (m.type === "sale") entry.sold += -m.delta;
    else if (m.type === "credit") entry.credited += -m.delta;
    else if (m.type === "restock") entry.restocked += m.delta;
    else entry.adjusted += m.delta;
    entry.net += m.delta;
    byItem.set(m.itemId, entry);
  }
  const rows = Array.from(byItem.values()).sort((a, b) => a.name.localeCompare(b.name));
  const sortedLog = [...movements].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-neutral-600 mb-2">By item</h3>
        {rows.length === 0 ? (
          <p className="text-neutral-400 text-sm text-center py-6">
            No stock movement in this range
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-400 border-b">
                <th className="py-1.5 font-medium">Item</th>
                <th className="py-1.5 font-medium text-right">Sold</th>
                <th className="py-1.5 font-medium text-right">Credited</th>
                <th className="py-1.5 font-medium text-right">Restocked</th>
                <th className="py-1.5 font-medium text-right">Adjusted</th>
                <th className="py-1.5 font-medium text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-b last:border-0">
                  <td className="py-1.5">{r.name}</td>
                  <td className="py-1.5 text-right text-red-600">
                    {r.sold ? `-${r.sold}` : "—"}
                  </td>
                  <td className="py-1.5 text-right text-orange-600">
                    {r.credited ? `-${r.credited}` : "—"}
                  </td>
                  <td className="py-1.5 text-right text-green-700">
                    {r.restocked ? `+${r.restocked}` : "—"}
                  </td>
                  <td className="py-1.5 text-right text-blue-700">
                    {r.adjusted !== 0 ? (r.adjusted > 0 ? `+${r.adjusted}` : r.adjusted) : "—"}
                  </td>
                  <td
                    className={`py-1.5 text-right font-semibold ${
                      r.net >= 0 ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {r.net > 0 ? `+${r.net}` : r.net}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-sm text-neutral-600 mb-2">Log</h3>
        {sortedLog.length === 0 ? (
          <p className="text-neutral-400 text-sm text-center py-6">No entries in this range</p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-auto">
            {sortedLog.map((m) => (
              <div key={m.id} className="flex justify-between items-center text-xs border-b py-1.5">
                <span className="text-neutral-400 w-16 shrink-0">
                  {new Date(m.timestamp).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <span className="flex-1 px-2 truncate">{m.itemName}</span>
                <span className="capitalize text-neutral-500 w-20 text-right">{m.type}</span>
                <span
                  className={`w-14 text-right font-semibold ${
                    m.delta >= 0 ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
