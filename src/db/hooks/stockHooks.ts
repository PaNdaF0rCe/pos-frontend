import { useListVals } from "react-firebase-hooks/database";
import { ref } from "firebase/database";
import { firebaseDB } from "../database";
import { StockMovement } from "../../types/StockMovement.type";

export function useListStockMovements() {
  return useListVals<StockMovement>(ref(firebaseDB, "stockMovements"));
}
