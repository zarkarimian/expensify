"use client"

import { useMemo, useState } from "react"
import { endOfMonth, format, isWithinInterval, startOfMonth } from "date-fns"
import {
  Banknote,
  Bitcoin,
  CreditCard,
  Loader2,
  Wallet,
  ArrowRightLeft,
  Pencil,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useExpenses } from "@/src/hooks/use-expenses"
import {
  useAccounts,
  useCreateTransfer,
  useDeleteTransfer,
  useTransfers,
  useUpdateTransfer,
} from "@/src/hooks/use-accounts"
import type { Account, Expense, Transfer } from "@/src/lib/expense-types"
import { ManageAccountsDialog } from "@/components/budget/manage-accounts-dialog"
import { cn } from "@/lib/utils"

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

type AccountSlice = {
  id: string
  name: string
  type: string
  currency: string
  balance: number
  totalSpent: number
  remaining: number
  monthSpent: number
  byCategory: Map<string, number>
}

function curCode(c: string) {
  return c.length === 3 ? c : "USD"
}

function aggregateAccountMonth(
  account: Account,
  monthExpenses: Expense[],
): AccountSlice {
  const rows = monthExpenses.filter((e) => e.accountId === account.id)
  let monthSpent = 0
  const byCategory = new Map<string, number>()
  for (const e of rows) {
    monthSpent += e.amount
    const cat = e.category?.trim() || "Uncategorized"
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + e.amount)
  }
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    currency: account.currency,
    balance: account.balance,
    totalSpent: account.totalSpent,
    remaining: account.remaining,
    monthSpent,
    byCategory,
  }
}

export default function BudgetPage() {
  const { data: expenses = [], isLoading: loadingExp } = useExpenses()
  const { data: accounts = [], isLoading: loadingAcc } = useAccounts()
  const { data: transfers = [], isLoading: loadingTr } = useTransfers()
  const createTransfer = useCreateTransfer()
  const updateTransfer = useUpdateTransfer()
  const deleteTransfer = useDeleteTransfer()
  const loading = loadingExp || loadingAcc

  const [transferOpen, setTransferOpen] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null)
  const [fromId, setFromId] = useState("")
  const [toId, setToId] = useState("")
  const [txAmount, setTxAmount] = useState("")
  const [txNote, setTxNote] = useState("")
  const [txError, setTxError] = useState<string | null>(null)

  const monthKey = format(new Date(), "yyyy-MM")
  const badgeText = useMemo(
    () => format(new Date(), "MMM yyyy"),
    [monthKey],
  )

  const monthExpenses = useMemo(() => {
    const n = new Date()
    const start = startOfMonth(n)
    const end = endOfMonth(n)
    return expenses.filter((e) => {
      const d = new Date(e.createdAt)
      return isWithinInterval(d, { start, end })
    })
  }, [expenses, monthKey])

  const totalMonth = useMemo(
    () => monthExpenses.reduce((s, e) => s + e.amount, 0),
    [monthExpenses],
  )

  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + a.balance, 0),
    [accounts],
  )

  const totalSummaryRemaining = totalBalance - totalMonth

  const accountSlices = useMemo(
    () => accounts.map((a) => aggregateAccountMonth(a, monthExpenses)),
    [accounts, monthExpenses],
  )

  function openNewTransfer() {
    setEditingTransfer(null)
    setFromId("")
    setToId("")
    setTxAmount("")
    setTxNote("")
    setTxError(null)
    setTransferOpen(true)
  }

  function openEditTransfer(t: Transfer) {
    setEditingTransfer(t)
    setFromId(t.fromAccountId)
    setToId(t.toAccountId)
    setTxAmount(String(t.amount))
    setTxNote(t.note ?? "")
    setTxError(null)
    setTransferOpen(true)
  }

  function closeTransferDialog() {
    setTransferOpen(false)
    setEditingTransfer(null)
    setFromId("")
    setToId("")
    setTxAmount("")
    setTxNote("")
    setTxError(null)
  }

  async function submitTransfer() {
    if (!fromId || !toId) {
      setTxError("Select both accounts")
      return
    }
    if (fromId === toId) {
      setTxError("Accounts must be different")
      return
    }
    const n = parseFloat(txAmount)
    if (Number.isNaN(n) || n <= 0) {
      setTxError("Enter a valid positive amount")
      return
    }
    setTxError(null)
    try {
      if (editingTransfer) {
        await updateTransfer.mutateAsync({
          id: editingTransfer.id,
          input: {
            fromAccountId: fromId,
            toAccountId: toId,
            amount: n,
            note: txNote.trim() || null,
          },
        })
      } else {
        await createTransfer.mutateAsync({
          fromAccountId: fromId,
          toAccountId: toId,
          amount: n,
          note: txNote.trim() || undefined,
        })
      }
      closeTransferDialog()
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transfer failed")
    }
  }

  async function confirmDeleteTransfer(t: Transfer) {
    if (typeof window !== "undefined" && !window.confirm("Delete this transfer?")) {
      return
    }
    try {
      await deleteTransfer.mutateAsync(t.id)
    } catch {
      /* useMutation onError if needed */
    }
  }

  if (loading) {
    return (
      <section className="ml-20 mr-20 mt-10">
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </section>
    )
  }

  if (accounts.length === 0) {
    return (
      <section className="ml-20 mr-20 mt-10 space-y-6 max-w-3xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Budget</h1>
            <p className="text-muted-foreground">Account-based spending by wallet or bank.</p>
          </div>
          <ManageAccountsDialog />
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Create your first account to track money across cash, bank, crypto, and more.
              Then add expenses and transfers from the forms.
            </p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="ml-20 mr-20 mt-10 space-y-8 mb-20 max-w-5xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget</h1>
          <p className="text-muted-foreground">This month, by account.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={openNewTransfer}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer
          </Button>
          <ManageAccountsDialog />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-medium">This month</CardTitle>
            <Badge variant="secondary" className="w-fit">
              {badgeText}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1 sm:grid-cols-3 sm:gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total balance</p>
              <p className="text-lg font-semibold tabular-nums">
                {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total spent (this month)</p>
              <p className="text-lg font-semibold tabular-nums">
                {totalMonth.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total remaining</p>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  totalSummaryRemaining >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-destructive",
                )}
              >
                {totalSummaryRemaining.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {accountSlices.map((slice) => {
          const Icon = accountTypeIcon(slice.type)
          const ccy = curCode(slice.currency)
          const spendRatioPct =
            slice.balance > 0
              ? Math.min(100, (slice.totalSpent / slice.balance) * 100)
              : slice.totalSpent > 0
                ? 100
                : 0
          const atRisk = spendRatioPct >= 80
          const categories = Array.from(slice.byCategory.entries()).sort(
            (a, b) => b[1] - a[1],
          )
          return (
            <Card key={slice.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {slice.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {slice.currency} · {slice.type}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3 sm:gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Starting balance</p>
                    <p className="font-semibold tabular-nums">
                      {slice.balance.toLocaleString(undefined, {
                        style: "currency",
                        currency: ccy,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="font-semibold tabular-nums">
                      {slice.totalSpent.toLocaleString(undefined, {
                        style: "currency",
                        currency: ccy,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p
                      className={cn(
                        "font-semibold tabular-nums",
                        slice.remaining >= 0
                          ? "text-emerald-600 dark:text-emerald-500"
                          : "text-destructive",
                      )}
                    >
                      {slice.remaining.toLocaleString(undefined, {
                        style: "currency",
                        currency: ccy,
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Spend vs starting balance: {spendRatioPct.toFixed(0)}%
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress
                  value={spendRatioPct}
                  className={cn(
                    "h-2",
                    atRisk &&
                      "**:data-[slot=progress-indicator]:bg-destructive!",
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  This month:{" "}
                  {slice.monthSpent.toLocaleString(undefined, {
                    style: "currency",
                    currency: ccy,
                  })}
                </p>
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No expenses this month</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">Categories (this month)</p>
                    {categories.map(([cat, amt]) => (
                      <li
                        key={cat}
                        className="flex justify-between gap-2 border-b border-border/50 pb-1 last:border-0"
                      >
                        <span className="text-muted-foreground">{cat}</span>
                        <span className="font-medium">
                          {amt.toLocaleString(undefined, {
                            style: "currency",
                            currency: ccy,
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Transfers</h2>
        {loadingTr ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : transfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transfers yet.</p>
        ) : (
          <ul className="space-y-2">
            {transfers.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 rounded-md border border-border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5 sm:flex-1">
                  <p>
                    {t.fromAccount.name} → {t.toAccount.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(t.createdAt), "MMM d, yyyy · HH:mm")}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className="font-medium tabular-nums sm:text-right">
                    {t.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => openEditTransfer(t)}
                      disabled={
                        createTransfer.isPending ||
                        updateTransfer.isPending ||
                        deleteTransfer.isPending
                      }
                      aria-label="Edit transfer"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => void confirmDeleteTransfer(t)}
                      disabled={
                        deleteTransfer.isPending && deleteTransfer.variables === t.id
                      }
                      aria-label="Delete transfer"
                    >
                      {deleteTransfer.isPending && deleteTransfer.variables === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={transferOpen}
        onOpenChange={(open) => (open ? setTransferOpen(true) : closeTransferDialog())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTransfer ? "Edit transfer" : "Transfer between accounts"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={fromId || undefined} onValueChange={setFromId}>
                <SelectTrigger>
                  <SelectValue placeholder="From account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} disabled={a.id === toId}>
                      {a.name} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={toId || undefined} onValueChange={setToId}>
                <SelectTrigger>
                  <SelectValue placeholder="To account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} disabled={a.id === fromId}>
                      {a.name} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-amt">Amount</Label>
              <Input
                id="tx-amt"
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-note">Note (optional)</Label>
              <Textarea
                id="tx-note"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                rows={2}
              />
            </div>
            {txError ? <p className="text-sm text-destructive">{txError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeTransferDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submitTransfer()}
              disabled={createTransfer.isPending || updateTransfer.isPending}
            >
              {createTransfer.isPending || updateTransfer.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingTransfer ? (
                "Save"
              ) : (
                "Transfer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
