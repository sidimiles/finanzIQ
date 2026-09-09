export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'credit_card' | 'investment';
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  color: string | null;
  icon: string | null;
  is_default: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  amount: number; // positive = income, negative = expense
  description: string | null;
  merchant: string | null;
  transaction_date: string;
  is_recurring: boolean;
  recurring_id: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  color: string | null;
  icon: string | null;
  is_completed: boolean;
  created_at: string;
};

export type RecurringPayment = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  next_due_date: string;
  day_of_month: number | null;
  is_active: boolean;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  amount_limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  created_at: string;
};
