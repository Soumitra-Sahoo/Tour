export interface Trip {
  id: string;
  name: string;
  shareToken: string;
  status: 'active' | 'locked';
  categories: Category[];
  ownerId?: string;
  treasurerId?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  name: string;
  isOwner: boolean;
  memberCode?: string; // only present for the owner's view
}

export interface CurrentMember {
  id: string;
  name: string;
  isOwner: boolean;
}

export interface Share {
  memberId: string;
  amountPaise: number;
}

export interface Expense {
  id: string;
  note?: string;
  category: string;
  amountPaise: number;
  splitType: 'equal' | 'custom';
  payers: Share[];
  participants: Share[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Advance {
  id: string;
  memberId: string;
  amountPaise: number;
  note?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberBalance {
  memberId: string;
  name: string;
  isOwner: boolean;
  totalPaidPaise: number;
  totalSharePaise: number;
  totalAdvancePaise: number;
  netBalancePaise: number;
  expensesPaidCount: number;
}

export interface Settlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amountPaise: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
}

export interface TripSummary {
  totalExpensePaise: number;
  expenseCount: number;
  totalAdvancePaise: number;
}

export interface PayerFormEntry {
  memberId: string;
  amount?: string;
}

export interface ShareFormEntry {
  memberId: string;
  amount?: string;
}

export interface CreateExpensePayload {
  amount: string;
  note?: string;
  category: string;
  payers: PayerFormEntry[];
  participantIds: string[];
  splitType: 'equal' | 'custom';
  customShares?: ShareFormEntry[];
  idempotencyKey?: string;
}
