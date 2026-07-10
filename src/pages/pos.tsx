import { useState } from "react";
import { useListCategories, useListItems } from "../db/hooks/dbHooks";
import { useListStockBatches } from "../db/hooks/batchHooks";
import { AiOutlineLoading } from "react-icons/ai";
import { IoAddOutline, IoRemoveOutline } from "react-icons/io5";
import { FaRegTrashAlt } from "react-icons/fa";
import { Item } from "../types/Item.type";
import { OrderItem } from "../types/Order.type";
import { placeOrder } from "../db/mutations/orderMutate";
import { MdOutlinePayment, MdOutlineLocalAtm } from "react-icons/md";
import { IoSearchOutline, IoCloseOutline } from "react-icons/io5";
import { addUnitToCart, nextUnitPrice, reservedQtyForItem } from "../lib/cartPricing";

type CartEntry = OrderItem;

export default function POSPage() {
  const [items, itemsLoading] = useListItems();
  const [categories, catLoading] = useListCategories();
  const [batches, batchesLoading] = useListStockBatches();
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [checkout, setCheckout] = useState<null | "cash" | "card">(null);
  const [cashInput, setCashInput] = useState("");
  const [placing, setPlacing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    orderNum: number;
    method: string;
    total: number;
    change?: number;
  } | null>(null);

  const isLoading = itemsLoading || catLoading || batchesLoading;

  const filteredItems = (
    activeCat === "all"
      ? items ?? []
      : (items ?? []).filter((i) => i.category === activeCat)
  ).filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()));

  const subtotal = cart.reduce((sum, e) => sum + e.total, 0);
  const cashAmt = parseFloat(cashInput) || 0;
  const change = cashAmt - subtotal;

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

  function removeFromCart(itemId: string, price: number) {
    setCart((prev) => prev.filter((e) => !(e.itemId === itemId && e.price === price)));
  }

  async function handlePayment(method: "cash" | "card") {
    if (cart.length === 0) return;
    setPlacing(true);
    const stockMap: Record<string, number> = {};
    for (const item of items ?? []) {
      if (item.id) stockMap[item.id] = item.stock;
    }
    await placeOrder(
      cart,
      subtotal,
      method,
      stockMap,
      batches ?? [],
      method === "cash" ? cashAmt : undefined
    );
    setLastReceipt({
      orderNum: Date.now(),
      method,
      total: subtotal,
      change: method === "cash" ? change : undefined,
    });
    setCart([]);
    setCheckout(null);
    setCashInput("");
    setPlacing(false);
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full animate-spin">
        <AiOutlineLoading className="w-10 h-10" />
      </div>
    );

  return (
    <div className="flex gap-4 w-full h-full">
      {/* Item Grid */}
      <div className="flex-1 min-w-0 bg-white rounded-lg p-4 flex flex-col gap-4 overflow-hidden">
        {/* Search */}
        <div className="relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full border rounded-lg pl-9 pr-9 py-2 text-sm outline-green-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCat("all")}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
              activeCat === "all"
                ? "bg-green-600 text-white"
                : "bg-neutral-100 hover:bg-neutral-200"
            }`}
          >
            All
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id!)}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                activeCat === cat.id
                  ? "bg-green-600 text-white"
                  : "bg-neutral-100 hover:bg-neutral-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-auto content-start">
          {filteredItems.length === 0 && (
            <p className="col-span-full text-neutral-400 text-sm text-center py-8">
              No items found
            </p>
          )}
          {filteredItems.map((item) => {
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
                className="relative flex flex-col items-center bg-neutral-50 border rounded-xl p-3 hover:bg-green-50 hover:border-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                <p className="text-sm font-semibold text-center leading-tight">
                  {item.name}
                </p>
                <p className="text-green-700 font-bold mt-1">
                  Rs. {(effectivePrice ?? item.price).toLocaleString()}
                </p>
                {item.stock <= 5 && item.stock > 0 && (
                  <span className="absolute top-2 right-2 bg-orange-100 text-orange-600 text-xs px-1 rounded">
                    {item.stock} left
                  </span>
                )}
                {item.stock === 0 && (
                  <span className="absolute top-2 right-2 bg-red-100 text-red-600 text-xs px-1 rounded">
                    Out
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="w-72 flex flex-col gap-3 bg-white rounded-lg p-4 h-full overflow-hidden">
        <h2 className="font-bold text-lg">Current Order</h2>

        {lastReceipt && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-3 text-sm">
            <p className="font-semibold text-green-700">Order placed!</p>
            <p>
              Total: <span className="font-bold">Rs. {lastReceipt.total.toLocaleString()}</span>
            </p>
            <p>Payment: {lastReceipt.method === "card" ? "Card" : "Cash"}</p>
            {lastReceipt.change !== undefined && (
              <p>
                Change: <span className="font-bold">Rs. {lastReceipt.change.toLocaleString()}</span>
              </p>
            )}
            <button
              className="mt-2 text-xs text-green-600 underline"
              onClick={() => setLastReceipt(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-neutral-400 text-sm mt-4 text-center">
            Tap items to add them
          </p>
        ) : (
          <div className="flex-1 overflow-auto space-y-2">
            {cart.map((entry) => (
              <div
                key={`${entry.itemId}-${entry.price}`}
                className="flex items-center gap-2 border rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{entry.name}</p>
                  <p className="text-xs text-neutral-500">
                    Rs. {entry.price.toLocaleString()} × {entry.qty}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => decrementLine(entry.itemId, entry.price)}
                    className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center"
                  >
                    <IoRemoveOutline className="w-3 h-3" />
                  </button>
                  <span className="text-sm w-4 text-center">{entry.qty}</span>
                  <button
                    onClick={() => incrementLine(entry.itemId)}
                    className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center"
                  >
                    <IoAddOutline className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(entry.itemId, entry.price)}
                    className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center ml-1"
                  >
                    <FaRegTrashAlt className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-3 mt-auto">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-500">Items</span>
            <span>{cart.reduce((s, e) => s + e.qty, 0)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>Rs. {subtotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment buttons */}
        {checkout === null ? (
          <div className="flex gap-2 mt-2">
            <button
              disabled={cart.length === 0}
              onClick={() => setCheckout("cash")}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg py-3 font-semibold transition-colors"
            >
              <MdOutlineLocalAtm className="w-5 h-5" />
              Cash
            </button>
            <button
              disabled={cart.length === 0}
              onClick={() => handlePayment("card")}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg py-3 font-semibold transition-colors"
            >
              <MdOutlinePayment className="w-5 h-5" />
              Card
            </button>
          </div>
        ) : checkout === "cash" ? (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-sm font-semibold text-neutral-600">
              Cash received
            </p>
            <input
              type="number"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              placeholder="Enter amount"
              className="border rounded-lg px-3 py-2 outline-green-400 text-lg font-bold"
              autoFocus
            />
            {cashAmt > 0 && (
              <div
                className={`flex justify-between rounded-lg px-3 py-2 text-sm font-semibold ${
                  change >= 0
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <span>Change</span>
                <span>Rs. {change.toLocaleString()}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setCheckout(null)}
                className="flex-1 border rounded-lg py-2 text-sm font-semibold hover:bg-neutral-50"
              >
                Back
              </button>
              <button
                disabled={cashAmt < subtotal || placing}
                onClick={() => handlePayment("cash")}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-semibold"
              >
                {placing ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        ) : null}

        {cart.length > 0 && checkout === null && (
          <button
            onClick={() => setCart([])}
            className="text-xs text-red-400 hover:text-red-600 text-center mt-1"
          >
            Clear order
          </button>
        )}
      </div>
    </div>
  );
}
