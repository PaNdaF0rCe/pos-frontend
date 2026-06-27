export type OrderItem = {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  total: number;
};

export type Order = {
  id?: string;
  orderNumber: number;
  items: OrderItem[];
  subtotal: number;
  paymentMethod: "cash" | "card";
  cashReceived?: number;
  change?: number;
  timestamp: number;
};
