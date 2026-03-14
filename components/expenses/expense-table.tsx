import React from 'react'

const ExpenseTable = () => {
    return (
        <div className="ml-20 mr-20 mt-6">
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
                <p className="text-muted-foreground text-l flex items-center justify-center mb-5">No expenses found. Add your first expense to get started!</p>
            </div>
        </div>
    )
}

export default ExpenseTable