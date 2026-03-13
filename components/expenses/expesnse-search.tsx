"use client"

import React from 'react'
import { Input } from '../ui/input'
import { Search } from 'lucide-react'

interface ExpenseSearchProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const ExpenseSearch = ({ searchQuery, setSearchQuery }: ExpenseSearchProps) => {
    return (
        <div className='flex items-center w-full max-w-sm relative'>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search by category or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
            />
        </div>
    )
}

export default ExpenseSearch