import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useTheme, cardShadow, radius, spacing } from '../../lib/theme';
import { accountTypeIcon } from '../../lib/icons';
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
      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, cardShadow, { shadowColor: colors.gradientTo }]}
      >
        <Text style={styles.heroLabel}>Gesamtvermögen</Text>
        <Text style={styles.heroValue}>
          {totalBalance.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/(modals)/transactions')}>
            <Ionicons name="list-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/(modals)/add-transfer')}>
            <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/(modals)/add-account')}>
            <Ionicons name="wallet-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.heroButton, styles.heroButtonPrimary]} onPress={() => router.push('/(modals)/add-transaction')}>
            <Ionicons name="add" size={20} color={colors.gradientTo} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Deine Konten</Text>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
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
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.empty, { color: colors.textMuted }]}>Noch keine Konten.{'\n'}Tippe oben auf das Wallet-Symbol.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, cardShadow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onLongPress={() => confirmDelete(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name={accountTypeIcon(item.type)} size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
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
  container: { flex: 1, paddingHorizontal: spacing.md, paddingTop: 56 },
  hero: { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  heroValue: { color: '#fff', fontSize: 38, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  heroButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonPrimary: { backgroundColor: '#fff' },
  sectionLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  emptyState: { alignItems: 'center', marginTop: 40, gap: 10 },
  empty: { textAlign: 'center', lineHeight: 20 },
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardType: { fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  cardBalance: { fontSize: 16, fontWeight: '700' },
});
