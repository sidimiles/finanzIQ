import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { Account } from '../../types/database';

export default function Accounts() {
  const { colors } = useTheme();
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete(account: Account) {
    Alert.alert('Konto löschen?', `"${account.name}" wird archiviert und aus der Liste entfernt.`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('accounts').update({ is_archived: true }).eq('id', account.id);
          load();
        },
      },
    ]);
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.header, { color: colors.textMuted }]}>Konten</Text>
          <Text style={[styles.total, { color: colors.text }]}>
            {totalBalance.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(modals)/transactions')}
          >
            <Ionicons name="list-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(modals)/add-transfer')}
          >
            <Ionicons name="swap-horizontal-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(modals)/add-account')}
          >
            <Ionicons name="wallet-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/(modals)/add-transaction')}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

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
          <Text style={[styles.empty, { color: colors.textMuted }]}>Noch keine Konten. Tippe oben auf das Wallet-Symbol, um eines anzulegen.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            onLongPress={() => confirmDelete(item)}
          >
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.cardType, { color: colors.textMuted }]}>{item.type}</Text>
            </View>
            <Text style={[styles.cardBalance, { color: colors.text }]}>
              {Number(item.balance).toLocaleString('de-CH', { style: 'currency', currency: item.currency })}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  header: { fontSize: 14, fontWeight: '600' },
  total: { fontSize: 32, fontWeight: '700', marginTop: 4 },
  headerButtons: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 170 },
  iconButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', marginTop: 40 },
  card: { borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardType: { fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  cardBalance: { fontSize: 16, fontWeight: '600' },
});
