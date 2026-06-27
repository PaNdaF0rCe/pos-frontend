import { useListVals } from "react-firebase-hooks/database";
import { ref } from "firebase/database";
import { firebaseDB } from "../database";
import { Order } from "../../types/Order.type";

export function useListOrders() {
  return useListVals<Order>(ref(firebaseDB, "orders"), { keyField: "id" });
}
