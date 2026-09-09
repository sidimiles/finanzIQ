import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

type Item = { id: string; name: string; color?: string | null };

export function ChipSelector({
  items,
  selectedId,
  onSelect,
}: {
  items: Item[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const active = item.id === selectedId;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.chip, active && { backgroundColor: item.color || '#4F8CFF', borderColor: item.color || '#4F8CFF' }]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#232B36',
    backgroundColor: '#151B23',
  },
  chipText: { color: '#8A93A3', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});
