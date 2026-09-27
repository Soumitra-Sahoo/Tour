import { z } from 'zod';

export const createTripSchema = z.object({
  name: z.string().trim().min(1, 'Please enter a trip name.').max(80),
  ownerName: z.string().trim().min(1, 'Please enter your name.').max(60),
  startDate: z.string().datetime().optional().or(z.literal('').transform(() => undefined)),
  endDate: z.string().datetime().optional().or(z.literal('').transform(() => undefined)),
});

export const addMemberSchema = z.object({
  name: z.string().trim().min(1, 'Please enter a name.').max(60),
});

export const identifySchema = z.object({
  memberId: z.string().min(1, 'Please select who you are.'),
  code: z.string().trim().min(1, 'Please enter your code.'),
});

export const addCategorySchema = z.object({
  name: z.string().trim().min(1, 'Please enter a category name.').max(40),
});

const shareInputSchema = z.object({
  memberId: z.string().min(1),
  amount: z.union([z.string(), z.number()]).optional(),
});

const expenseBaseSchema = z.object({
  amount: z.union([z.string(), z.number()]),
  note: z.string().trim().max(140).optional(),
  category: z.string().trim().min(1, 'Please choose a category.'),
  payers: z.array(shareInputSchema).min(1, 'An expense must have at least one payer.'),
  participantIds: z.array(z.string().min(1)).min(2, 'An expense must have at least 2 participants.'),
  splitType: z.enum(['equal', 'custom']),
  customShares: z.array(shareInputSchema).optional(),
});

const customSplitRefinement = (data: {
  splitType: 'equal' | 'custom';
  customShares?: { memberId: string; amount?: string | number }[];
}): boolean => data.splitType !== 'custom' || Boolean(data.customShares && data.customShares.length >= 2);

const customSplitRefinementOptions = {
  message: 'Custom split requires an amount for every participant.',
  path: ['customShares'],
};

export const createExpenseSchema = expenseBaseSchema
  .extend({
    idempotencyKey: z.string().min(1, 'Missing idempotency key.'),
  })
  .refine(customSplitRefinement, customSplitRefinementOptions);

export const updateExpenseSchema = expenseBaseSchema.refine(
  customSplitRefinement,
  customSplitRefinementOptions,
);

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;


export const addAdvanceSchema = z.object({
  memberId: z.string().min(1, 'Please select a person.'),
  amount: z.union([z.string(), z.number()]),
  note: z.string().trim().max(140).optional(),
});

export const updateAdvanceSchema = z.object({
  memberId: z.string().min(1).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  note: z.string().trim().max(140).optional(),
});
