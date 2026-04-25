import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createAccountApi,
  deleteAccountApi,
  fetchAccounts,
  patchAccountApi,
} from "@/src/lib/accounts-api";
import {
  createTransferApi,
  deleteTransferApi,
  fetchTransfers,
  updateTransferApi,
} from "@/src/lib/transfers-api";
import {
  accountKeys,
  expenseKeys,
  transferKeys,
} from "@/src/hooks/query-keys";
import type {
  CreateAccountInput,
  CreateTransferInput,
  PatchAccountInput,
  PatchTransferInput,
} from "@/src/lib/expense-types";

export { accountKeys, transferKeys } from "@/src/hooks/query-keys";

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: fetchAccounts,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => createAccountApi(input),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function usePatchAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: PatchAccountInput }) =>
      patchAccountApi(args.id, args.input),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccountApi(id),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useTransfers() {
  return useQuery({
    queryKey: transferKeys.all,
    queryFn: fetchTransfers,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransferInput) => createTransferApi(input),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
      await queryClient.invalidateQueries({ queryKey: transferKeys.all });
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: PatchTransferInput }) =>
      updateTransferApi(args.id, args.input),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
      await queryClient.invalidateQueries({ queryKey: transferKeys.all });
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransferApi(id),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
      await queryClient.invalidateQueries({ queryKey: transferKeys.all });
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}
