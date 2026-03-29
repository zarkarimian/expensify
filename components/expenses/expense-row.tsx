"use client"

interface ExpenseRowProps {
    filteredCount: number;
    totalCount: number;
    totalSpent: number;
}

const ExpenseRow = ({ filteredCount, totalCount, totalSpent }: ExpenseRowProps) => {
    return (
        <div className="ml-20 mr-20 mt-6">
            <div className="bg-card text-card-foreground border border-border rounded-lg p-4 flex justify-between items-center">
                <p className="text-muted-foreground text-sm">
                    showing {filteredCount} of {totalCount} expenses
                </p>
                <div className="text-right">
                    <p className="text-lg font-bold">Total: ${totalSpent.toFixed(2)}</p>
                </div>
            </div>
        </div>
    )
}

export default ExpenseRow