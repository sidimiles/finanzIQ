import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { RecurringPayment } from '../../types/database';

const frequencyLabel: Record<string, string> = {
  weekly: 'wöchentlich',
  biweekly: 'alle 2 Wochen',
  monthly: 'monatlich',
  yearly: 'jährlich',
};

export default function Recurring() {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('recurring_payments')
      .select('*')
      .eq('is_active', true)
      .order('next_due_date', { ascending: true });
    if (data) setPayments(data as RecurringPayment[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const monthlyTotal = payments.reduce((sum, p) => {
    const multiplier =
      p.frequency === 'weekly' ? 4.33 : p.frequency === 'biweekly' ? 2.17 : p.frequency === 'yearly' ? 1 / 12 : 1;
    return sum + Math.abs(Number(p.amount)) * multiplier;
  }, 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Wiederkehrend</Text>
          <Text style={styles.subheader}>~{monthlyTotal.toFixed(0)} CHF / Monat</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(modals)/add-recurring')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Keine wiederkehrenden Zahlungen. Tippe oben auf +.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>
                {frequencyLabel[item.frequency]} · nächste: {item.next_due_date}
              </Text>
            </View>
            <Text style={styles.cardAmount}>{Math.abs(Number(item.amount)).toFixed(0)} CHF</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14', padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  header: { fontSize: 24, color: '#fff', fontWeight: '700' },
  subheader: { fontSize: 14, color: '#8A93A3', marginTop: 4 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F8CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  cardSub: { color: '#8A93A3', fontSize: 13, marginTop: 2 },
  cardAmount: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
