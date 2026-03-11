import React from 'react'

const StateCard = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-5 ml-20 mr-20">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-10">Total Expense</h3>
                <p className="text-2xl font-bold">$0.00</p>
                <p className='text-sm text-gray-500'>0 transactions</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-10">This Month</h3>
                <p className="text-2xl font-bold">$0.00</p>
                <p className='text-sm text-gray-500'>March 2026</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-10">Categories</h3>
                <p className="text-2xl font-bold">0</p>
                <p className='text-sm text-gray-500'>Active categories</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-10">Average</h3>
                <p className="text-2xl font-bold">$0.00</p>
                <p className='text-sm text-gray-500'>Per transaction</p>
            </div>
        </div>
    )
}

export default StateCard