"use client"

import React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { expensesAtom } from '@/store/expenseAtom'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExpenseTableProps {
    category: string;
    sortBy: string;
}

const ExpenseTable = ({ category, sortBy }: ExpenseTableProps) => {
    const expenses = useAtomValue(expensesAtom)
    const setExpenses = useSetAtom(expensesAtom)

    const handleDelete = (id: string) => {
        setExpenses((prev) => prev.filter((exp) => exp.id !== id))
    }

    const filteredExpenses = expenses
        .filter(exp => category === 'all' || exp.category === category)
        .sort((a, b) => {
            if (sortBy === 'date') {
                const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
                if (dateDiff !== 0) return dateDiff
                return b.createdAt - a.createdAt
            } else if (sortBy === 'amount') {
                return b.amount - a.amount
            }
            return 0
        })

    return (
        <div className="ml-20 mr-20 mt-6">
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                {filteredExpenses.length === 0 ? (
                    <p className="text-muted-foreground text-l flex items-center justify-center mb-5">
                        No expenses found. Add your first expense to get started!
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border font-semibold text-muted-foreground">
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Description</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-md">{expense.description || '-'}</td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                                        <td className="py-3 px-4 text-right font-bold">${expense.amount.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                onClick={() => handleDelete(expense.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ExpenseTable