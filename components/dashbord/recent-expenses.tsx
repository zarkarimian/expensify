"use client"

import React from 'react'
import { useAtomValue } from 'jotai'
import { expensesAtom } from '@/store/expenseAtom'
import { format } from 'date-fns'

const RecentExpenses = () => {
    const expenses = useAtomValue(expensesAtom)

    const recentExpenses = [...expenses]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)


    return (
        <div className="ml-20 mr-20 mt-6">
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-6">Recent Expenses</h3>

                {recentExpenses.length === 0 ? (
                    <p className="text-muted-foreground text-l flex items-center justify-center mb-5">
                        No expenses yet. Add your first expense to get started!
                    </p>
                ) : (
                    <div className="space-y-4">
                        {recentExpenses.map((expense) => (
                            <div key={expense.id} className="flex justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium">{expense.category}</p>
                                        <p className="text-sm text-muted-foreground">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{expense.description || 'No description'}</p>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold">${expense.amount.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default RecentExpenses