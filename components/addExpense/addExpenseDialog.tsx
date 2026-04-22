"use client"

import { useEffect, useState } from "react"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EXPENSE_CATEGORIES } from "@/lib/constants/categories"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useCreateExpense } from "@/src/hooks/use-expenses"
import type { Expense, UpdateExpenseInput } from "@/src/lib/expense-types"

type UpdateMutation = UseMutationResult<Expense, Error, UpdateExpenseInput>

export type ExpenseFormDialogProps =
  | {
      mode: "create"
      expense?: undefined
      open?: boolean
      onOpenChange?: (open: boolean) => void
      trigger?: React.ReactNode
    }
  | {
      mode: "edit"
      expense: Expense
      /** Use `const u = useUpdateExpense()` in the parent and pass `u` for shared pending state (e.g. row loading). */
      updateExpense: UpdateMutation
      open?: boolean
      onOpenChange?: (open: boolean) => void
      trigger?: React.ReactNode
    }

function isEditProps(
  props: ExpenseFormDialogProps
): props is Extract<ExpenseFormDialogProps, { mode: "edit" }> {
  return props.mode === "edit"
}

export function ExpenseFormDialog(props: ExpenseFormDialogProps) {
  const { mode, open: openProp, onOpenChange, trigger } = props

  const createExpense = useCreateExpense()
  const updateMutation = isEditProps(props) ? props.updateExpense : null

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen

  const setOpen = (next: boolean) => {
    onOpenChange?.(next)
    if (!isControlled) {
      setUncontrolledOpen(next)
    }
  }

  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState("")
  const [description, setDescription] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)

  const expense = isEditProps(props) ? props.expense : undefined

  useEffect(() => {
    if (mode !== "edit" || !expense) {
      return
    }
    if (!open) {
      return
    }
    setAmount(String(expense.amount))
    setCategory(expense.category)
    setDate(format(new Date(expense.createdAt), "yyyy-MM-dd"))
    setDescription(expense.title)
    setSubmitError(null)
  }, [mode, expense, open])

  async function handleSubmit() {
    if (!amount || !category) {
      return
    }

    const parsed = parseFloat(amount)
    if (Number.isNaN(parsed)) {
      setSubmitError("Enter a valid amount")
      return
    }

    setSubmitError(null)
    const title = description.trim() || "Untitled expense"

    try {
      if (mode === "create") {
        await createExpense.mutateAsync({
          title,
          amount: parsed,
          category,
        })
        setAmount("")
        setCategory("")
        setDate("")
        setDescription("")
        setOpen(false)
        return
      }

      if (!expense || !updateMutation) {
        return
      }

      await updateMutation.mutateAsync({
        id: expense.id,
        title,
        amount: parsed,
        category,
      })
      setOpen(false)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong")
    }
  }

  const isPending = mode === "create" ? createExpense.isPending : (updateMutation?.isPending ?? false)

  const defaultTrigger = (
    <Button className="p-5" type="button">
      + Add Expense
    </Button>
  )
  const triggerNode =
    mode === "create"
      ? trigger !== undefined
        ? trigger
        : defaultTrigger
      : trigger !== undefined
        ? trigger
        : null

  const titleText = mode === "edit" ? "Edit Expense" : "Add New Expense"
  const primaryLabel = mode === "edit" ? "Save Changes" : "Add Expense"
  const pendingLabel = mode === "edit" ? "Saving…" : "Adding…"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerNode ? <DialogTrigger asChild>{triggerNode}</DialogTrigger> : null}

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount *</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category *</label>
            <Select
              onValueChange={(value) => setCategory(value)}
              value={category || undefined}
            >
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Add details about this expense..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {pendingLabel}
              </>
            ) : (
              primaryLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AddExpenseDialog() {
  return <ExpenseFormDialog mode="create" />
}
