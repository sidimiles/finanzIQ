import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { RecurringPayment } from '../../types/database';

type RP = RecurringPayment & { type: 'expense' | 'income' };

const frequencyLabel: Record<string, string> = {
  weekly: 'wöchentlich',
  biweekly: 'alle 2 Wochen',
  monthly: 'monatlich',
  yearly: 'jährlich',
};

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Recurring() {
  const { colors } = useTheme();
  const [payments, setPayments] = useState<RP[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('recurring_payments')
      .select('*')
      .eq('is_active', true)
      .order('next_due_date', { ascending: true });
    if (data) setPayments(data as RP[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete(payment: RP) {
    Alert.alert('Wiederkehrende Zahlung löschen?', `"${payment.name}" entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('recurring_payments').update({ is_active: false }).eq('id', payment.id);
          load();
        },
      },
    ]);
  }

  const monthlyExpense = payments
    .filter((p) => p.type !== 'income')
    .reduce((sum, p) => {
      const multiplier =
        p.frequency === 'weekly' ? 4.33 : p.frequency === 'biweekly' ? 2.17 : p.frequency === 'yearly' ? 1 / 12 : 1;
      return sum + Math.abs(Number(p.amount)) * multiplier;
    }, 0);
  const monthlyIncome = payments
    .filter((p) => p.type === 'income')
    .reduce((sum, p) => {
      const multiplier =
        p.frequency === 'weekly' ? 4.33 : p.frequency === 'biweekly' ? 2.17 : p.frequency === 'yearly' ? 1 / 12 : 1;
      return sum + Math.abs(Number(p.amount)) * multiplier;
    }, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.header, { color: colors.text }]}>Wiederkehrend</Text>
          <Text style={[styles.subheader, { color: colors.textMuted }]}>
            ~{monthlyExpense.toFixed(0)} CHF Ausgaben · ~{monthlyIncome.toFixed(0)} CHF Einnahmen / Monat
          </Text>
        </View>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/(modals)/add-recurring')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16 }}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Keine wiederkehrenden Zahlungen. Tippe oben auf +.</Text>}
        renderItem={({ item }) => {
          const days = daysUntil(item.next_due_date);
          const soon = days <= 3;
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card }]}
              onLongPress={() => confirmDelete(item)}
            >
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                  {frequencyLabel[item.frequency]} · {item.next_due_date}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.cardAmount, { color: item.type === 'income' ? colors.income : colors.text }]}>
                  {item.type === 'income' ? '+' : ''}
                  {Math.abs(Number(item.amount)).toFixed(0)} CHF
                </Text>
                {soon && (
                  <Text style={[styles.badge, { color: colors.expense }]}>
                    {days <= 0 ? 'fällig' : `in ${days}T`}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  header: { fontSize: 24, fontWeight: '700' },
  subheader: { fontSize: 14, marginTop: 4 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', marginTop: 40 },
  card: { borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSub: { fontSize: 13, marginTop: 2 },
  cardAmount: { fontSize: 16, fontWeight: '600' },
  badge: { fontSize: 11, fontWeight: '700', marginTop: 2 },
});
