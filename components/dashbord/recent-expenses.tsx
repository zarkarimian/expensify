import React from 'react'

const RecentExpenses = () => {
    return (
        <div className="ml-20 mr-20 mt-6">
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-10">Recent Expenses</h3>
                <p className="text-muted-foreground text-l flex items-center justify-center mb-5">No expenses yet. Add your first expense to get started!</p>
            </div>
        </div>
    )
}

export default RecentExpenses