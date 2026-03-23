"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EXPENSE_CATEGORIES } from "@/lib/constants/categories"

import { useSetAtom } from "jotai"
import { expensesAtom } from "@/store/expenseAtom"

export default function AddExpenseDialog() {

    const setExpenses = useSetAtom(expensesAtom)

    const [amount, setAmount] = useState("")
    const [category, setCategory] = useState("")
    const [date, setDate] = useState("")
    const [description, setDescription] = useState("")

    function handleSubmit() {

        if (!amount || !category) return

        const newExpense = {
            id: crypto.randomUUID(),
            amount: parseFloat(amount),
            category,
            date: date || new Date().toISOString().split('T')[0],
            description,
            createdAt: Date.now()
        }

        setExpenses((prev) => [...prev, newExpense])

        // Clear fields
        setAmount("")
        setCategory("")
        setDate("")
        setDescription("")
    }

    return (
        <Dialog>

            <DialogTrigger asChild>
                <Button className="p-5">
                    + Add Expense
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">

                <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">

                    {/* Amount */}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Amount *</label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    {/* Category */}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category *</label>

                        <Select onValueChange={(value) => setCategory(value)}>

                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>

                            <SelectContent>

                                {EXPENSE_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}

                            </SelectContent>

                        </Select>

                    </div>

                    {/* Date */}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {/* Description */}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            placeholder="Add details about this expense..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline">
                        Cancel
                    </Button>

                    <Button onClick={handleSubmit}>
                        Add Expense
                    </Button>
                </DialogFooter>

            </DialogContent>

        </Dialog>
    )
}