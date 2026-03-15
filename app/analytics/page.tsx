import ExpensesRengeCard from '@/components/analytics/expenses-renge-card'
import React from 'react'

const AnalyticsPage = () => {
    return (
        <section>
            <h1 className='text-3xl font-bold mt-10 ml-20'>Analytics</h1>
            <p className='ml-20 text-muted-foreground'>Visualize your spending patterns</p>
            <ExpensesRengeCard />
        </section>
    )
}

export default AnalyticsPage