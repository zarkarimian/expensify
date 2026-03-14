"use client"

import AddExpenseDialog from '@/components/addExpense/addExpenseDialog'
import ExpenseSearch from '@/components/expenses/expesnse-search'
import React, { useState } from 'react'
import ExpenseTable from '@/components/expenses/expense-table'
import ExpenseRow from '@/components/expenses/expense-row'
import ExpenseFilter from '@/components/expenses/expesne-filter'

const ExpensesPage = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [category, setCategory] = useState('all')
    const [sortBy, setSortBy] = useState('date')

    return (
        <section>
            <div className='flex justify-between items-start'>
                <div>
                    <h1 className='text-3xl font-bold mt-10 ml-20 mb-2'>Expenses</h1>
                    <p className='ml-20 text-muted-foreground'>Track and manage your expenses</p>
                </div>
                <div className='mr-20 mt-10'>
                    <AddExpenseDialog />
                </div>
            </div>

            <div className='mt-8 ml-20 mr-20 mb-8 flex flex-col xl:flex-row gap-4 items-center justify-between'>
                <div className='w-full xl:w-1/3'>
                    <ExpenseSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                </div>
                <div className='w-full xl:w-2/3 flex justify-end'>
                    <ExpenseFilter 
                        category={category} setCategory={setCategory}
                        sortBy={sortBy} setSortBy={setSortBy}
                    />
                </div>
            </div>

            <ExpenseRow />

            <ExpenseTable />
        </section>
    )
}

export default ExpensesPage