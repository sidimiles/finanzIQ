import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { ChipSelector } from '../../components/ChipSelector';
import { Category } from '../../types/database';

const COLORS = ['#4F8CFF', '#FF6B6B', '#FFB86B', '#A78BFA', '#4ADE80', '#F472B6', '#8A93A3'];
const TYPE_OPTIONS = [
  { id: 'expense', name: 'Ausgabe' },
  { id: 'income', name: 'Einnahme' },
];

export default function Categories() {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'expense' | 'income'>('expense');
  const [newColor, setNewColor] = useState(COLORS[0]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('type').order('name');
    if (data) setCategories(data as Category[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleAdd() {
    if (!newName.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from('categories').insert({
      user_id: user?.id,
      name: newName.trim(),
      type: newType,
      color: newColor,
      is_default: false,
    });
    if (error) {
      Alert.alert('Fehler', error.message);
      return;
    }
    setNewName('');
    load();
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    await supabase.from('categories').update({ name: editName.trim() }).eq('id', id);
    setEditingId(null);
    load();
  }

  function confirmDelete(cat: Category) {
    Alert.alert('Kategorie löschen?', `"${cat.name}" löschen? Buchungen behalten ihren Betrag, verlieren aber die Kategorie.`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('categories').delete().eq('id', cat.id);
          load();
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.addTitle, { color: colors.text }]}>Neue Kategorie</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
          placeholder="Name"
          placeholderTextColor={colors.textMuted}
          value={newName}
          onChangeText={setNewName}
        />
        <View style={{ marginTop: 10 }}>
          <ChipSelector items={TYPE_OPTIONS} selectedId={newType} onSelect={(id) => setNewType(id as 'expense' | 'income')} />
        </View>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, newColor === c && styles.colorDotActive]}
              onPress={() => setNewColor(c)}
            />
          ))}
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Hinzufügen</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.card }]}>
            <View style={[styles.dot, { backgroundColor: item.color || colors.accent }]} />
            {editingId === item.id ? (
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                value={editName}
                onChangeText={setEditName}
                autoFocus
                onSubmitEditing={() => handleRename(item.id)}
              />
            ) : (
              <Text style={[styles.rowText, { color: colors.text }]}>{item.name}</Text>
            )}
            <View style={styles.rowActions}>
              {editingId === item.id ? (
                <TouchableOpacity onPress={() => handleRename(item.id)}>
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(item.id);
                    setEditName(item.name);
                  }}
                >
                  <Ionicons name="pencil-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => confirmDelete(item)} style={{ marginLeft: 16 }}>
                <Ionicons name="trash-outline" size={18} color={colors.expense} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  addCard: { borderRadius: 14, padding: 16, borderWidth: 1 },
  addTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  input: { borderRadius: 10, padding: 12, borderWidth: 1 },
  colorRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },
  addButton: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 14 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  rowText: { flex: 1, fontSize: 15 },
  editInput: { flex: 1, fontSize: 15, borderBottomWidth: 1, paddingVertical: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
});
