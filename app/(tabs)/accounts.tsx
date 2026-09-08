import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Account } from '../../types/database';

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: true });
    if (!error && data) setAccounts(data as Account[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Konten</Text>
      <Text style={styles.total}>
        {totalBalance.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
      </Text>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Noch keine Konten. Füge dein erstes Konto hinzu.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardType}>{item.type}</Text>
            </View>
            <Text style={styles.cardBalance}>
              {Number(item.balance).toLocaleString('de-CH', { style: 'currency', currency: item.currency })}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14', padding: 20, paddingTop: 60 },
  header: { fontSize: 14, color: '#8A93A3', fontWeight: '600' },
  total: { fontSize: 36, color: '#fff', fontWeight: '700', marginTop: 4 },
  empty: { color: '#8A93A3', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#151B23',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cardType: { color: '#8A93A3', fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  cardBalance: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
