"use client"

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpenseFormDialog } from '@/components/addExpense/addExpenseDialog'
import type { Expense } from '@/src/lib/expense-types'
import { useDeleteExpense, useUpdateExpense } from '@/src/hooks/use-expenses'

interface ExpenseTableProps {
    expenses: Expense[];
}

const ExpenseTable = ({ expenses }: ExpenseTableProps) => {
    const [editing, setEditing] = useState<Expense | null>(null)
    const deleteExpense = useDeleteExpense()
    const updateExpense = useUpdateExpense()
    const deletingId =
        deleteExpense.isPending && deleteExpense.variables !== undefined
            ? deleteExpense.variables
            : undefined

    const updatingId =
        updateExpense.isPending && updateExpense.variables !== undefined
            ? updateExpense.variables.id
            : undefined

    const handleDelete = (id: string) => {
        deleteExpense.mutate(id)
    }

    return (
        <div className="ml-20 mr-20 mt-6">
            {editing ? (
                <ExpenseFormDialog
                    key={editing.id}
                    mode="edit"
                    expense={editing}
                    open
                    onOpenChange={(o) => {
                        if (!o) {
                            setEditing(null)
                        }
                    }}
                    updateExpense={updateExpense}
                />
            ) : null}
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                {expenses.length === 0 ? (
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
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                                                {expense.category?.trim() || '—'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-md">{expense.title?.trim() || '-'}</td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">{format(new Date(expense.createdAt), 'MMM dd, yyyy')}</td>
                                        <td className="py-3 px-4 text-right font-bold">${expense.amount.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="inline-flex items-center justify-end gap-0.5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                                                onClick={() => setEditing(expense)}
                                                disabled={updatingId === expense.id}
                                                aria-label="Edit expense"
                                            >
                                                {updatingId === expense.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Pencil className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                onClick={() => handleDelete(expense.id)}
                                                disabled={deleteExpense.isPending}
                                                aria-label="Delete expense"
                                            >
                                                {deletingId === expense.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                            </div>
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
