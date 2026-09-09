import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';

function csvEscape(val: any): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportTransactionsCSV() {
  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_date, amount, description, category:categories(name), account:accounts(name)')
    .order('transaction_date', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as any[];
  const header = ['Datum', 'Betrag', 'Beschreibung', 'Kategorie', 'Konto'];
  const lines = [header.join(',')];
  rows.forEach((r) => {
    lines.push(
      [r.transaction_date, r.amount, csvEscape(r.description), csvEscape(r.category?.name ?? ''), csvEscape(r.account?.name ?? '')].join(',')
    );
  });
  const csv = lines.join('\n');

  const fileUri = FileSystem.documentDirectory + `finanziq-buchungen-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Buchungen exportieren' });
  }
  return fileUri;
}

export async function exportFullBackupJSON() {
  const [accounts, categories, transactions, budgets, recurring, goals] = await Promise.all([
    supabase.from('accounts').select('*'),
    supabase.from('categories').select('*'),
    supabase.from('transactions').select('*'),
    supabase.from('budgets').select('*'),
    supabase.from('recurring_payments').select('*'),
    supabase.from('goals').select('*'),
  ]);

  const backup = {
    exported_at: new Date().toISOString(),
    accounts: accounts.data,
    categories: categories.data,
    transactions: transactions.data,
    budgets: budgets.data,
    recurring_payments: recurring.data,
    goals: goals.data,
  };

  const fileUri = FileSystem.documentDirectory + `finanziq-backup-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2), { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Backup exportieren' });
  }
  return fileUri;
}
