"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { EXPENSE_CATEGORIES } from "@/lib/constants/categories"
import { Banknote, Bitcoin, CreditCard, Loader2, Wallet } from "lucide-react"
import { format } from "date-fns"
import { useCreateExpense } from "@/src/hooks/use-expenses"
import { useAccounts, useCreateAccount } from "@/src/hooks/use-accounts"
import type { AccountType, CreateAccountInput, Expense, UpdateExpenseInput } from "@/src/lib/expense-types"

const ADD_ACCOUNT_VALUE = "__add_new__"

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank / card" },
  { value: "crypto", label: "Crypto" },
  { value: "other", label: "Other" },
]

function accountTypeIcon(t: string) {
  switch (t) {
    case "cash":
      return Banknote
    case "bank":
      return CreditCard
    case "crypto":
      return Bitcoin
    default:
      return Wallet
  }
}

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
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const createAccount = useCreateAccount()

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen

  const expense = isEditProps(props) ? props.expense : undefined

  const todayDateOnly = () => format(new Date(), "yyyy-MM-dd")

  const resetForCreate = () => {
    setAmount("")
    setCategory("")
    setAccountId("")
    setDate(todayDateOnly())
    setDescription("")
    setSubmitError(null)
  }

  const populateForEdit = (nextExpense: Expense) => {
    setAmount(String(nextExpense.amount))
    setCategory(nextExpense.category ?? "")
    setAccountId(nextExpense.accountId)
    setDate(format(new Date(nextExpense.createdAt), "yyyy-MM-dd"))
    setDescription(nextExpense.title ?? "")
    setSubmitError(null)
  }

  const setOpen = (next: boolean) => {
    // Initialize state when the dialog opens (avoids setState-in-effect lint).
    if (next && !open) {
      if (mode === "edit" && expense) {
        populateForEdit(expense)
      } else {
        resetForCreate()
      }
    }

    onOpenChange?.(next)
    if (!isControlled) {
      setUncontrolledOpen(next)
    }
  }

  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [accountId, setAccountId] = useState("")
  const [date, setDate] = useState("")
  const [description, setDescription] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountType, setNewAccountType] = useState<AccountType>("cash")
  const [newAccountCurrency, setNewAccountCurrency] = useState("USD")
  const [newAccountBalance, setNewAccountBalance] = useState("0")
  const [newAccountError, setNewAccountError] = useState<string | null>(null)

  async function handleAddAccount() {
    const name = newAccountName.trim()
    if (!name) {
      setNewAccountError("Name is required")
      return
    }
    const balParsed = parseFloat(newAccountBalance)
    if (Number.isNaN(balParsed) || !Number.isFinite(balParsed)) {
      setNewAccountError("Starting balance must be a valid number")
      return
    }
    const cur = newAccountCurrency.trim().toUpperCase() || "USD"
    setNewAccountError(null)
    try {
      const input: CreateAccountInput = {
        name,
        type: newAccountType,
        currency: cur,
        balance: balParsed,
      }
      const created = await createAccount.mutateAsync(input)
      setAccountId(created.id)
      setNewAccountName("")
      setNewAccountType("cash")
      setNewAccountCurrency("USD")
      setNewAccountBalance("0")
      setAddAccountOpen(false)
    } catch (e) {
      setNewAccountError(e instanceof Error ? e.message : "Could not add account")
    }
  }

  async function handleSubmit() {
    if (!amount || !category) {
      return
    }
    if (!accountId) {
      setSubmitError("Select an account")
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
          accountId,
          date: date || todayDateOnly(),
        })
        resetForCreate()
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
        accountId,
        date: date || todayDateOnly(),
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
    <>
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
              <label className="text-sm font-medium">Account *</label>
              <Select
                value={accountId || undefined}
                onValueChange={(v) => {
                  if (v === ADD_ACCOUNT_VALUE) {
                    setAddAccountOpen(true)
                    return
                  }
                  setAccountId(v)
                }}
                disabled={accountsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      accountsLoading ? "Loading…" : "Select account"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => {
                    const Icon = accountTypeIcon(a.type)
                    return (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0 opacity-80" />
                          <span>
                            {a.name}{" "}
                            <span className="text-muted-foreground text-xs">
                              ({a.currency})
                            </span>
                          </span>
                        </span>
                      </SelectItem>
                    )
                  })}
                  <SelectItem value={ADD_ACCOUNT_VALUE} className="text-primary">
                    + Add new account
                  </SelectItem>
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

      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New account</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="acc-name">Name</Label>
              <Input
                id="acc-name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g. Main checking, Cash, USDT"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newAccountType}
                onValueChange={(v) => setNewAccountType(v as AccountType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-currency">Currency</Label>
              <Input
                id="acc-currency"
                value={newAccountCurrency}
                onChange={(e) => setNewAccountCurrency(e.target.value)}
                placeholder="USD"
                maxLength={12}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-balance">Starting balance *</Label>
              <Input
                id="acc-balance"
                type="number"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {newAccountError ? (
              <p className="text-sm text-destructive">{newAccountError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setAddAccountOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleAddAccount()}
              disabled={createAccount.isPending}
            >
              {createAccount.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function AddExpenseDialog() {
  return <ExpenseFormDialog mode="create" />
}
