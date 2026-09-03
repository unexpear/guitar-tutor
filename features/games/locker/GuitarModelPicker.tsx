import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '../../../components/PressableScale';
import { Colors, CARD_SHADOW } from '../../../constants/Colors';
import { GUITAR_DESIGNS } from '../../progression/guitarDesigns';
import {
  GUITAR_MODELS,
  guitarModelsForType,
  type GuitarModel,
  type GuitarType,
} from '../../progression/guitarModels';
import { useProgressStore } from '../../store/progressStore';
import FullGuitarSvg from './FullGuitarSvg';

interface GuitarModelPickerProps {
  visible: boolean;
  onClose: () => void;
  guitarType?: GuitarType;
}

function previewDesign(model: GuitarModel) {
  return GUITAR_DESIGNS.find(
    (design) => design.guitarType === model.guitarType && design.rarity === 'Starter',
  )!;
}

export default function GuitarModelPicker({ visible, onClose, guitarType }: GuitarModelPickerProps) {
  const selected = useProgressStore((state) => state.selectedGuitarModelIds);
  const select = useProgressStore((state) => state.selectGuitarModel);
  const models = guitarType ? guitarModelsForType(guitarType) : GUITAR_MODELS;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Close guitar model picker">
        <Pressable
          style={styles.sheet}
          onPress={(event) => event.stopPropagation()}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headingCopy}>
              <Text style={styles.title}>Choose Guitar Model</Text>
              <Text style={styles.subtitle}>Models are free. Finishes are collected separately.</Text>
            </View>
            <PressableScale onPress={onClose} style={styles.close} accessibilityLabel="Close model picker">
              <Ionicons name="close" size={22} color={Colors.dark.text} />
            </PressableScale>
          </View>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <View accessibilityRole="radiogroup" style={styles.cards}>
              {models.map((model) => {
                const active = selected[model.guitarType] === model.id;
                return (
                  <PressableScale
                    key={model.id}
                    onPress={() => select(model.id)}
                    style={[styles.card, active && styles.cardActive, CARD_SHADOW]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={`${model.name}, ${model.guitarType}. ${model.description}${active ? ' Selected.' : ''}`}
                  >
                    <View style={styles.preview}>
                      <FullGuitarSvg design={previewDesign(model)} modelId={model.id} width={92} height={150} />
                    </View>
                    <Text style={styles.modelType}>{model.guitarType.toUpperCase()}</Text>
                    <Text style={styles.modelName}>{model.name}</Text>
                    <Text style={styles.description}>{model.description}</Text>
                    <View style={[styles.selection, active && styles.selectionActive]}>
                      <Text style={[styles.selectionText, active && styles.selectionTextActive]}>
                        {active ? 'EQUIPPED' : 'SELECT'}
                      </Text>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: { maxHeight: '82%', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: Colors.dark.background, paddingBottom: 28 },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 11, backgroundColor: Colors.dark.cardBorder },
  header: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
  headingCopy: { flex: 1 },
  title: { color: Colors.dark.text, fontSize: 21, fontWeight: '900' },
  subtitle: { color: Colors.dark.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.surfaceElevated },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', minHeight: 268, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: Colors.dark.cardBorder, backgroundColor: Colors.dark.card },
  cardActive: { borderColor: Colors.success, borderWidth: 2, backgroundColor: 'rgba(76,175,80,0.08)' },
  preview: { height: 152, alignItems: 'center', justifyContent: 'center' },
  modelType: { color: Colors.success, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  modelName: { color: Colors.dark.text, fontSize: 14, fontWeight: '900', marginTop: 3 },
  description: { color: Colors.dark.muted, fontSize: 11, lineHeight: 15, marginTop: 3, minHeight: 31 },
  selection: { alignSelf: 'flex-start', borderRadius: 10, borderWidth: 1, borderColor: Colors.dark.cardBorder, paddingHorizontal: 9, paddingVertical: 5, marginTop: 9 },
  selectionActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  selectionText: { color: Colors.dark.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  selectionTextActive: { color: '#071408' },
});
