/** Central query keys to avoid circular imports between feature hooks. */
export const expenseKeys = {
  all: ["expenses"] as const,
};

export const accountKeys = {
  all: ["accounts"] as const,
};

export const transferKeys = {
  all: ["transfers"] as const,
};
