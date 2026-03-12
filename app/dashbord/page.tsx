import React from 'react'
import StateCard from '@/components/dashbord/stat-card'
import RecentExpenses from '@/components/dashbord/recent-expenses'
import AddExpenseDialog from '@/components/addExpense/addExpenseDialog'

const DashbordPage = () => {
    return (
        <section>
            <h1 className='text-3xl font-bold mt-10 ml-20 mb-2'>Dashbord</h1>
            <p className='ml-20 text-gray-500'>Track and manage your expenses</p>
            <div className='flex justify-end mr-20'>
                <AddExpenseDialog />
            </div>
            <StateCard />
            <RecentExpenses />
        </section>
    )
}

export default DashbordPage