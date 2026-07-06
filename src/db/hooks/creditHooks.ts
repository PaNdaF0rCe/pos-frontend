import { useListVals } from "react-firebase-hooks/database";
import { ref } from "firebase/database";
import { firebaseDB } from "../database";
import { Person } from "../../types/Person.type";
import { CreditEntry } from "../../types/CreditEntry.type";

export function useListPeople() {
  return useListVals<Person>(ref(firebaseDB, "people"));
}

export function useListCreditEntries() {
  return useListVals<CreditEntry>(ref(firebaseDB, "creditEntries"));
}
