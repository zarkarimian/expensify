import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

export interface Expense {
    id: string;
    amount: number;
    category: string;
    date: string;
    description: string;
    createdAt: number;
}

export const expensesAtom = atomWithStorage<Expense[]>("expenses", [])