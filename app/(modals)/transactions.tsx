import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { ChipSelector } from '../../components/ChipSelector';
import { exportTransactionsCSV } from '../../lib/export';
import { Account, Category } from '../../types/database';

type TxRow = {
  id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  account_id: string;
  category_id: string | null;
  category: { name: string; color: string | null } | null;
  account: { name: string } | null;
};

export default function Transactions() {
  const { colors } = useTheme();
  const [rows, setRows] = useState<TxRow[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('transactions')
      .select('id, amount, description, transaction_date, account_id, category_id, category:categories(name, color), account:accounts(name)')
      .order('transaction_date', { ascending: false })
      .limit(500);
    if (data) setRows(data as any);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: accs } = await supabase.from('accounts').select('*').eq('is_archived', false);
      if (accs) setAccounts(accs as Account[]);
      const { data: cats } = await supabase.from('categories').select('*');
      if (cats) setCategories(cats as Category[]);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (accountFilter && r.account_id !== accountFilter) return false;
      if (categoryFilter && r.category_id !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          (r.description ?? '').toLowerCase().includes(q) ||
          (r.category?.name ?? '').toLowerCase().includes(q) ||
          (r.account?.name ?? '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [rows, search, accountFilter, categoryFilter]);

  function confirmDelete(row: TxRow) {
    Alert.alert('Buchung löschen?', row.description || 'Diese Buchung entfernen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          const { data: acc } = await supabase.from('accounts').select('balance').eq('id', row.account_id).single();
          if (acc) {
            await supabase
              .from('accounts')
              .update({ balance: Number(acc.balance) - Number(row.amount) })
              .eq('id', row.account_id);
          }
          await supabase.from('transactions').delete().eq('id', row.id);
          load();
        },
      },
    ]);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportTransactionsCSV();
    } catch (e: any) {
      Alert.alert('Fehler beim Export', e.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.topBar}>
        <TextInput
          style={[styles.search, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Suchen..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleExport} disabled={exporting}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <ChipSelector
          items={[{ id: '__all__', name: 'Alle Konten' }, ...accounts]}
          selectedId={accountFilter ?? '__all__'}
          onSelect={(id) => setAccountFilter(id === '__all__' ? null : id)}
        />
      </View>
      <View style={styles.filterSection}>
        <ChipSelector
          items={[{ id: '__all__', name: 'Alle Kategorien' }, ...categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))]}
          selectedId={categoryFilter ?? '__all__'}
          onSelect={(id) => setCategoryFilter(id === '__all__' ? null : id)}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Keine Buchungen gefunden.</Text>}
        renderItem={({ item }) => {
          const positive = Number(item.amount) >= 0;
          return (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onLongPress={() => confirmDelete(item)}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.desc, { color: colors.text }]}>{item.description || item.category?.name || 'Buchung'}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {item.account?.name} · {item.category?.name ?? '—'} · {item.transaction_date}
                </Text>
              </View>
              <Text style={[styles.amount, { color: positive ? colors.income : colors.expense }]}>
                {positive ? '+' : ''}
                {Number(item.amount).toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', gap: 8, padding: 20, paddingBottom: 8 },
  search: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1 },
  exportButton: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterSection: { paddingHorizontal: 20, marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 40 },
  card: { borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  desc: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 3 },
  amount: { fontSize: 16, fontWeight: '700', marginLeft: 12 },
});
