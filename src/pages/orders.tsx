import { useListOrders } from "../db/hooks/orderHooks";
import { AiOutlineLoading } from "react-icons/ai";
import { MdOutlinePayment, MdOutlineLocalAtm } from "react-icons/md";
import { useState } from "react";
import { Order } from "../types/Order.type";

export default function OrdersPage() {
  const [orders, loading] = useListOrders();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full animate-spin">
        <AiOutlineLoading className="w-10 h-10" />
      </div>
    );

  const sorted = [...(orders ?? [])].sort((a, b) => b.timestamp - a.timestamp);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = sorted.filter(
    (o) => o.timestamp >= todayStart.getTime()
  );
  const todayTotal = todayOrders.reduce((s, o) => s + o.subtotal, 0);

  return (
    <div className="max-w-[850px] w-full rounded-lg p-4 pb-6 bg-white">
      <h2 className="text-black font-bold text-xl mb-4">Sales History</h2>

      {/* Today summary */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Today's Sales</p>
          <p className="text-2xl font-bold text-green-700">
            Rs. {todayTotal.toLocaleString()}
          </p>
          <p className="text-sm text-neutral-400">{todayOrders.length} orders</p>
        </div>
        <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Cash Today</p>
          <p className="text-2xl font-bold text-blue-700">
            Rs.{" "}
            {todayOrders
              .filter((o) => o.paymentMethod === "cash")
              .reduce((s, o) => s + o.subtotal, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Card Today</p>
          <p className="text-2xl font-bold text-purple-700">
            Rs.{" "}
            {todayOrders
              .filter((o) => o.paymentMethod === "card")
              .reduce((s, o) => s + o.subtotal, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Order list */}
      <div className="space-y-2 overflow-auto max-h-[500px] pr-1">
        {sorted.length === 0 && (
          <p className="text-neutral-400 text-sm text-center py-8">
            No orders yet
          </p>
        )}
        {sorted.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            expanded={expanded === order.id}
            onToggle={() =>
              setExpanded(expanded === order.id ? null : order.id!)
            }
          />
        ))}
      </div>
    </div>
  );
}

function OrderRow({
  order,
  expanded,
  onToggle,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
}) {
  const date = new Date(order.timestamp);
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
            {order.items.reduce((s, i) => s + i.qty, 0)} items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ${
              order.paymentMethod === "card"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {order.paymentMethod === "card" ? (
              <MdOutlinePayment className="w-3 h-3" />
            ) : (
              <MdOutlineLocalAtm className="w-3 h-3" />
            )}
            {order.paymentMethod === "card" ? "Card" : "Cash"}
          </span>
          <span className="font-bold text-green-700">
            Rs. {order.subtotal.toLocaleString()}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3 space-y-1">
          {order.items.map((item, i) => (
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
          {order.paymentMethod === "cash" && order.cashReceived !== undefined && (
            <div className="mt-2 pt-2 border-t flex justify-between text-sm text-neutral-500">
              <span>Cash received</span>
              <span>Rs. {order.cashReceived.toLocaleString()}</span>
            </div>
          )}
          {order.change !== undefined && (
            <div className="flex justify-between text-sm text-neutral-500">
              <span>Change given</span>
              <span>Rs. {order.change.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
