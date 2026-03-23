"use client"

import React from 'react'
import { useAtomValue } from 'jotai'
import { expensesAtom } from '@/store/expenseAtom'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ExpenseFilterProps {
    category: string;
    setCategory: (category: string) => void;
    sortBy: string;
    setSortBy: (sortBy: string) => void;
}

const ExpenseFilter = ({
    category, setCategory,
    sortBy, setSortBy
}: ExpenseFilterProps) => {
    const expenses = useAtomValue(expensesAtom)

    // Get unique categories from existing expenses
    const dynamicCategories = Array.from(new Set(expenses.map(exp => exp.category))).sort()

    return (
        <div className="flex gap-4 items-center justify-end">
            {/* Category Filter */}
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-100 dark:bg-zinc-800">
                    <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {dynamicCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Sort By Filter */}
            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-100 dark:bg-zinc-800">
                    <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="amount">Sort by Amount</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

export default ExpenseFilter

