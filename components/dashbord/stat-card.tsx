"use client"

import React from 'react'
import { useAtomValue } from 'jotai'
import { expensesAtom } from '@/store/expenseAtom'
import { format } from 'date-fns'

const StateCard = () => {
    const expenses = useAtomValue(expensesAtom)

    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const transactionCount = expenses.length

    const currentMonth = format(new Date(), 'yyyy-MM')
    const thisMonthExpense = expenses
        .filter(exp => exp.date.startsWith(currentMonth))
        .reduce((sum, exp) => sum + exp.amount, 0)

    const uniqueCategories = new Set(expenses.map(exp => exp.category)).size
    const averageExpense = transactionCount > 0 ? totalExpense / transactionCount : 0

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