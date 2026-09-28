import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import PressableScale from './PressableScale';

export default function ChoiceChips<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
    {options.map(option => <PressableScale key={option.value} onPress={() => onChange(option.value)}
      accessibilityRole="radio" accessibilityState={{ checked: value === option.value }}
      style={[styles.chip, value === option.value && styles.selected]}>
      <Text style={[styles.label, value === option.value && styles.selectedLabel]}>{option.label}</Text>
    </PressableScale>)}
  </View>;
}
const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: Layout.touch, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: Colors.dark.cardBorder, backgroundColor: Colors.dark.card },
  selected: { borderColor: Colors.success, backgroundColor: '#193629' },
  label: { color: Colors.dark.muted, fontSize: 14, fontWeight: '600' },
  selectedLabel: { color: Colors.dark.text },
});
