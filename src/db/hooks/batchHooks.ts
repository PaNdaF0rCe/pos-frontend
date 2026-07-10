import { useListVals } from "react-firebase-hooks/database";
import { ref } from "firebase/database";
import { firebaseDB } from "../database";
import { StockBatch } from "../../types/StockBatch.type";

export function useListStockBatches() {
  return useListVals<StockBatch>(ref(firebaseDB, "stockBatches"));
}
