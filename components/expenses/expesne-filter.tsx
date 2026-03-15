"use client"

import React from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
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
    return (
        <div className="flex gap-4 items-center justify-end">
            {/* Category Filter */}
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-100">
                    <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                </SelectContent>
            </Select>

            {/* Sort By Filter */}
            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-100">
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
