"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  usePatchAccount,
} from "@/src/hooks/use-accounts"
import type { Account, AccountType, CreateAccountInput } from "@/src/lib/expense-types"

const TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank / card" },
  { value: "crypto", label: "Crypto" },
  { value: "other", label: "Other" },
]

export function ManageAccountsDialog() {
  const { data: accounts = [] } = useAccounts()
  const create = useCreateAccount()
  const patch = usePatchAccount()
  const del = useDeleteAccount()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<AccountType>("cash")
  const [currency, setCurrency] = useState("USD")
  const [balance, setBalance] = useState("0")
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [editBalance, setEditBalance] = useState("")
  const [editError, setEditError] = useState<string | null>(null)

  function openEdit(a: Account) {
    setEditing(a)
    setEditBalance(String(a.balance))
    setEditError(null)
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!editing) {
      return
    }
    const n = parseFloat(editBalance)
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      setEditError("Balance must be a valid number")
      return
    }
    setEditError(null)
    try {
      await patch.mutateAsync({ id: editing.id, input: { balance: n } })
      setEditOpen(false)
      setEditing(null)
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Update failed")
    }
  }

  async function handleAdd() {
    const n = name.trim()
    if (!n) {
      setFormError("Name is required")
      return
    }
    const bal = parseFloat(balance)
    if (Number.isNaN(bal) || !Number.isFinite(bal)) {
      setFormError("Starting balance must be a valid number")
      return
    }
    setFormError(null)
    const input: CreateAccountInput = {
      name: n,
      type,
      currency: currency.trim().toUpperCase() || "USD",
      balance: bal,
    }
    try {
      await create.mutateAsync(input)
      setName("")
      setType("cash")
      setCurrency("USD")
      setBalance("0")
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to add")
    }
  }

  async function handleDelete(id: string) {
    setDeleteError(null)
    try {
      await del.mutateAsync(id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed"
      setDeleteError(
        msg.includes("linked") || msg.includes("Cannot delete")
          ? "Cannot delete an account with expenses. Reassign or remove expenses first."
          : msg,
      )
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            Manage Accounts
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accounts</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-sm font-medium">Add account</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="manage-acc-name">Name</Label>
                  <Input
                    id="manage-acc-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Main checking, Cash"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as AccountType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manage-acc-cur">Currency</Label>
                  <Input
                    id="manage-acc-cur"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    maxLength={12}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="manage-acc-bal">Starting balance *</Label>
                  <Input
                    id="manage-acc-bal"
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => void handleAdd()}
                    disabled={create.isPending}
                  >
                    {create.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add account"
                    )}
                  </Button>
                </div>
              </div>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            </div>

            {deleteError ? (
              <p className="text-sm text-destructive">{deleteError}</p>
            ) : null}

            <ul className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {accounts.length === 0 ? (
                <li className="text-sm text-muted-foreground">No accounts yet. Add one above.</li>
              ) : (
                accounts.map((a) => {
                  const deleting = del.isPending && del.variables === a.id
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {a.name}{" "}
                          <span className="text-xs text-muted-foreground font-normal">
                            {a.currency} · {a.type}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {a.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={() => openEdit(a)}
                          aria-label={`Edit ${a.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={del.isPending}
                          onClick={() => void handleDelete(a.id)}
                          aria-label={`Delete ${a.name}`}
                        >
                          {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit starting balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {editing?.name}
            </p>
            <div className="space-y-2">
              <Label htmlFor="edit-bal">Balance</Label>
              <Input
                id="edit-bal"
                type="number"
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
              />
            </div>
            {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveEdit()}
              disabled={patch.isPending}
            >
              {patch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
