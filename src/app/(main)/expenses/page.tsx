"use client"

import AddExpenseDialog from '@/components/addExpense/addExpenseDialog'
import ExpenseSearch from '@/components/expenses/expesnse-search'
import React, { useState, useMemo } from 'react'
import ExpenseTable from '@/components/expenses/expense-table'
import ExpenseRow from '@/components/expenses/expense-row'
import ExpenseFilter from '@/components/expenses/expesne-filter'
import { useExpenses } from '@/src/hooks/use-expenses'
import { Loader2 } from 'lucide-react'

const ExpensesPage = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [category, setCategory] = useState('all')
    const [sortBy, setSortBy] = useState('date')
    const { data: expenses = [], isPending, isError, error, refetch } = useExpenses()

    const categoryOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    expenses
                        .map((e) => e.category?.trim())
                        .filter((c): c is string => Boolean(c)),
                ),
            ).sort(),
        [expenses],
    )

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(exp => {
                const matchesCategory =
                    category === 'all' || exp.category === category
                const title = (exp.title ?? "").toLowerCase()
                const cat = (exp.category ?? "").toLowerCase()
                const q = searchQuery.toLowerCase()
                const matchesSearch =
                    title.includes(q) || cat.includes(q)
                return matchesCategory && matchesSearch
            })
            .sort((a, b) => {
                if (sortBy === 'date') {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                } else if (sortBy === 'amount') {
                    return b.amount - a.amount
                }
                return 0
            })
    }, [expenses, searchQuery, category, sortBy])

    const totalCount = expenses.length
    const filteredCount = filteredExpenses.length
    const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    if (isPending) {
        return (
            <section className="flex min-h-[40vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p>Loading expenses…</p>
                </div>
            </section>
        )
    }

    if (isError) {
        return (
            <section className="ml-20 mt-10 space-y-4">
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
            </section>
        )
    }

    return (
        <section>
            <div className='flex justify-between items-start'>
                <div>
                    <h1 className='text-3xl font-bold mt-10 ml-20 mb-2'>Expenses</h1>
                    <p className='ml-20 text-muted-foreground'>View and manage all your expenses</p>
                </div>
                <div className='mr-20 mt-10'>
                    <AddExpenseDialog />
                </div>
            </div>

            <div className='mt-8 ml-20 mr-20 mb-8 flex gap-4 items-center justify-between'>
                <div className='flex-1'>
                    <ExpenseSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                </div>
                <div className='flex items-center shrink-0'>
                    <ExpenseFilter
                        category={category} setCategory={setCategory}
                        sortBy={sortBy} setSortBy={setSortBy}
                        categories={categoryOptions}
                    />
                </div>
            </div>

            <ExpenseRow 
                filteredCount={filteredCount} 
                totalCount={totalCount} 
                totalSpent={totalSpent} 
            />

            <ExpenseTable expenses={filteredExpenses} />
        </section>
    )
}

export default ExpensesPage
