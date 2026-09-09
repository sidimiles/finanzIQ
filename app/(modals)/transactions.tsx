import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

type TxRow = {
  id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  account_id: string;
  category: { name: string; color: string | null } | null;
  account: { name: string } | null;
};

export default function Transactions() {
  const { colors } = useTheme();
  const [rows, setRows] = useState<TxRow[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('transactions')
      .select('id, amount, description, transaction_date, account_id, category:categories(name, color), account:accounts(name)')
      .order('transaction_date', { ascending: false })
      .limit(200);
    if (data) setRows(data as any);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete(row: TxRow) {
    Alert.alert('Buchung löschen?', row.description || 'Diese Buchung entfernen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          // reverse the balance effect
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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Noch keine Buchungen.</Text>}
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
  empty: { textAlign: 'center', marginTop: 40 },
  card: { borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  desc: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 3 },
  amount: { fontSize: 16, fontWeight: '700', marginLeft: 12 },
});
