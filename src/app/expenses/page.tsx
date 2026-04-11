"use client"

import AddExpenseDialog from '@/components/addExpense/addExpenseDialog'
import ExpenseSearch from '@/components/expenses/expesnse-search'
import React, { useState, useMemo } from 'react'
import ExpenseTable from '@/components/expenses/expense-table'
import ExpenseRow from '@/components/expenses/expense-row'
import ExpenseFilter from '@/components/expenses/expesne-filter'
import { useAtomValue } from 'jotai'
import { expensesAtom } from '@/store/expenseAtom'

const ExpensesPage = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [category, setCategory] = useState('all')
    const [sortBy, setSortBy] = useState('date')
    const expenses = useAtomValue(expensesAtom)

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(exp => {
                const matchesCategory = category === 'all' || exp.category === category
                const matchesSearch = 
                    exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    exp.category.toLowerCase().includes(searchQuery.toLowerCase())
                return matchesCategory && matchesSearch
            })
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
    }, [expenses, searchQuery, category, sortBy])

    const totalCount = expenses.length
    const filteredCount = filteredExpenses.length
    const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)

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