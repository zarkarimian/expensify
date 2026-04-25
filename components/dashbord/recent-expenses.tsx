"use client"

import React from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useExpenses } from '@/src/hooks/use-expenses'

const RecentExpenses = () => {
    const { data: expenses = [], isPending, isError, error, refetch } = useExpenses()

    const recentExpenses = [...expenses]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

    return (
        <div className="ml-20 mr-20 mt-6">
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-6">Recent Expenses</h3>

                {isPending ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Loading…</p>
                    </div>
                ) : isError ? (
                    <div className="space-y-2">
                        <p className="text-destructive">
                            {error instanceof Error ? error.message : 'Failed to load expenses'}
                        </p>
                        <button
                            type="button"
                            className="text-sm text-muted-foreground underline"
                            onClick={() => void refetch()}
                        >
                            Try again
                        </button>
                    </div>
                ) : recentExpenses.length === 0 ? (
                    <p className="text-muted-foreground text-l flex items-center justify-center mb-5">
                        No expenses yet. Add your first expense to get started!
                    </p>
                ) : (
                    <div className="space-y-4">
                        {recentExpenses.map((expense) => (
                            <div key={expense.id} className="flex justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium">{expense.category ?? '—'}</p>
                                        <p className="text-sm text-muted-foreground">{format(new Date(expense.createdAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{expense.title || 'No description'}</p>
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
