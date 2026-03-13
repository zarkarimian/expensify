"use client"

import AddExpenseDialog from '@/components/addExpense/addExpenseDialog'
import ExpenseSearch from '@/components/expenses/expesnse-search'
import React, { useState } from 'react'

const ExpensesPage = () => {
    const [searchQuery, setSearchQuery] = useState('')

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

            <div className='mt-8 ml-20 mb-8 w-full max-w-md'>
                <ExpenseSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>
        </section>
    )
}

export default ExpensesPage