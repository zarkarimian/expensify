import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createExpenseApi,
  deleteExpenseApi,
  fetchExpenses,
  updateExpenseApi,
} from "@/src/lib/expenses-api";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/src/lib/expense-types";

export const expenseKeys = {
  all: ["expenses"] as const,
};

export function useExpenses() {
  return useQuery({
    queryKey: expenseKeys.all,
    queryFn: fetchExpenses,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpenseApi(input),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateExpenseInput) => updateExpenseApi(input),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpenseApi(id),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}
