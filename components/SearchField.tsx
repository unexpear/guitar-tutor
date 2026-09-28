import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import PressableScale from './PressableScale';

export default function SearchField({ value, onChangeText, placeholder }: {
  value: string; onChangeText: (value: string) => void; placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  return <View style={[styles.field, focused && styles.focused]}>
    <Ionicons name="search" size={20} color={Colors.dark.muted} />
    <TextInput style={styles.input} value={value} onChangeText={onChangeText}
      placeholder={placeholder} placeholderTextColor={Colors.dark.muted}
      accessibilityLabel={placeholder} autoCorrect={false} autoCapitalize="none"
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} returnKeyType="search" />
    {!!value && <PressableScale accessibilityLabel={`Clear ${placeholder.toLowerCase()}`} onPress={() => onChangeText('')} style={styles.clear}><Text style={styles.clearText}>×</Text></PressableScale>}
  </View>;
}
const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: Layout.touch, borderWidth: 1, borderColor: Colors.dark.cardBorder, borderRadius: 12, paddingLeft: 12, backgroundColor: Colors.dark.card },
  focused: { borderColor: Colors.success },
  input: { flex: 1, minWidth: 0, minHeight: Layout.touch, paddingVertical: 10, fontSize: 16, color: Colors.dark.text },
  clear: { minHeight: Layout.touch, width: Layout.touch, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 24, color: Colors.dark.text },
});
