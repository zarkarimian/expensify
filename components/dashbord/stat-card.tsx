"use client"

import React from 'react'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useExpenses } from '@/src/hooks/use-expenses'

const StateCard = () => {
    const { data: expenses = [], isPending, isError, error, refetch } = useExpenses()

    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const transactionCount = expenses.length

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const thisMonthExpense = expenses
        .filter(exp => {
            const d = new Date(exp.createdAt)
            return isWithinInterval(d, { start: monthStart, end: monthEnd })
        })
        .reduce((sum, exp) => sum + exp.amount, 0)

    const uniqueCategories = new Set(expenses.map(exp => exp.category)).size
    const averageExpense = transactionCount > 0 ? totalExpense / transactionCount : 0

    if (isPending) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-5 ml-20 mr-20">
                <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-10">Total Expense</h3>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className='text-sm text-muted-foreground mt-4'>Loading…</p>
                </div>
                <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-10">This Month</h3>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className='text-sm text-muted-foreground mt-4'>Loading…</p>
                </div>
                <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-10">Categories</h3>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className='text-sm text-muted-foreground mt-4'>Loading…</p>
                </div>
                <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-10">Average</h3>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className='text-sm text-muted-foreground mt-4'>Loading…</p>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-5 ml-20 mr-20">
                <div className="bg-card text-card-foreground border border-border rounded-lg p-6 col-span-full">
                    <p className="text-destructive mb-2">
                        {error instanceof Error ? error.message : 'Failed to load stats'}
                    </p>
                    <button
                        type="button"
                        className="text-sm text-muted-foreground underline"
                        onClick={() => void refetch()}
                    >
                        Try again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-5 ml-20 mr-20">
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-10">Total Expense</h3>
                <p className="text-2xl font-bold">${totalExpense.toFixed(2)}</p>
                <p className='text-sm text-muted-foreground'>{transactionCount} transactions</p>
            </div>
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-10">This Month</h3>
                <p className="text-2xl font-bold">${thisMonthExpense.toFixed(2)}</p>
                <p className='text-sm text-muted-foreground'>{format(new Date(), 'MMMM yyyy')}</p>
            </div>
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-10">Categories</h3>
                <p className="text-2xl font-bold">{uniqueCategories}</p>
                <p className='text-sm text-muted-foreground'>Active categories</p>
            </div>
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-10">Average</h3>
                <p className="text-2xl font-bold">${averageExpense.toFixed(2)}</p>
                <p className='text-sm text-muted-foreground'>Per transaction</p>
            </div>
        </div>
    )
}

export default StateCard
