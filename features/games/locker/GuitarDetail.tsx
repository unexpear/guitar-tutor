import React from 'react';
import { Modal, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { Layout, Type } from '../../../constants/Layout';
import PressableScale from '../../../components/PressableScale';
import Guitar3D from '../../tuner/components/Guitar3D';
import { usePauseThumbnails } from './GuitarThumbnail';
import type { GuitarDesign } from '../../progression/guitarDesigns';
import type { GuitarModelId } from '../../progression/guitarModels';

export type GuitarDetailItem = { name: string; description: string; design: GuitarDesign; modelId: GuitarModelId; action: string; onEquip?: () => void };

/** Only the selected item mounts a 3D renderer, never every collection card. */
export default function GuitarDetail({ item, onClose }: { item: GuitarDetailItem | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  usePauseThumbnails(!!item);
  if (!item) return null;
  return <Modal visible animationType="slide" onRequestClose={onClose}>
    <View style={[styles.page, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
      <View style={styles.header}><PressableScale style={styles.button} onPress={onClose} accessibilityLabel="Back to My Guitars"><Text style={styles.text}>← Back</Text></PressableScale><Text style={styles.title}>Guitar preview</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.preview}><Guitar3D modelId={item.modelId} design={item.design} /></View>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.copy}>{item.description}</Text>
        <PressableScale disabled={!item.onEquip} accessibilityState={{ disabled: !item.onEquip }} onPress={() => { item.onEquip?.(); onClose(); }} style={[styles.button, item.onEquip && styles.primary]}>
          <Text style={[styles.text, item.onEquip && styles.primaryText]}>{item.action}</Text>
        </PressableScale>
      </ScrollView>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: Layout.page, flexDirection: 'row', alignItems: 'center', gap: 16 },
  content: { width: '100%', maxWidth: Layout.readingWidth, alignSelf: 'center', padding: Layout.page, gap: 16 },
  preview: { height: 320 },
  title: { ...Type.heading, color: Colors.dark.text, flexShrink: 1 },
  copy: { ...Type.body, color: Colors.dark.muted },
  text: { fontSize: 15, fontWeight: '700', color: Colors.dark.text },
  button: { minHeight: Layout.touch, borderRadius: 12, backgroundColor: Colors.dark.surfaceElevated, padding: 12, justifyContent: 'center', alignItems: 'center' },
  primary: { backgroundColor: Colors.success },
  primaryText: { color: '#071408' },
});
