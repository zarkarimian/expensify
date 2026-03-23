"use client"

import React from 'react'
import { useAtomValue } from 'jotai'
import { expensesAtom } from '@/store/expenseAtom'

const ExpenseRow = () => {
    const expenses = useAtomValue(expensesAtom)
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)

    return (
        <div className="ml-20 mr-20 mt-6">
            <div className="bg-card text-card-foreground border border-border rounded-lg p-4 flex justify-between items-center">
                <p className="text-muted-foreground text-sm">
                    showing {expenses.length} of {expenses.length} expenses
                </p>
                <div className="text-right">
                    <p className="text-lg font-bold">Total: ${totalSpent.toFixed(2)}</p>
                </div>
            </div>
        </div>
    )
}

export default ExpenseRow