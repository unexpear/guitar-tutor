import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, CARD_SHADOW } from '../constants/Colors';
import { GuitarType } from '../features/store/userPreferencesStore';

interface GuitarPart {
  id: string;
  name: string;
  description: string;
  category: 'headstock' | 'neck' | 'body' | 'acoustic' | 'electric';
  position: { x: number; y: number };
}

const GUITAR_PARTS: GuitarPart[] = [
  // Headstock parts
  {
    id: 'headstock',
    name: 'Headstock',
    description: 'The top of the guitar where tuning machines are mounted. It anchors the strings and helps maintain tuning stability.',
    category: 'headstock',
    position: { x: 50, y: 5 },
  },
  {
    id: 'tuning_machines',
    name: 'Tuning Machines',
    description: 'Also called tuning pegs or machine heads. These allow you to adjust string tension to tune each string.',
    category: 'headstock',
    position: { x: 75, y: 8 },
  },
  {
    id: 'nut',
    name: 'Nut',
    description: 'A small notched piece at the top of the fretboard. It guides the strings and defines one end of the vibrating string length.',
    category: 'headstock',
    position: { x: 50, y: 15 },
  },
  
  // Neck parts
  {
    id: 'neck',
    name: 'Neck',
    description: 'The long piece connecting the headstock to the body. Your fretting hand holds the neck while playing.',
    category: 'neck',
    position: { x: 50, y: 25 },
  },
  {
    id: 'fretboard',
    name: 'Fretboard',
    description: 'Also called fingerboard. The thin piece of wood on top of the neck where you press strings to play notes and chords.',
    category: 'neck',
    position: { x: 50, y: 30 },
  },
  {
    id: 'frets',
    name: 'Frets',
    description: 'Metal strips on the fretboard that divide it into fixed pitch positions. Pressing behind a fret changes the note.',
    category: 'neck',
    position: { x: 50, y: 35 },
  },
  {
    id: 'inlays',
    name: 'Inlays',
    description: 'Markers (usually dots) at the 3rd, 5th, 7th, 9th, and 12th frets. They help you navigate the fretboard.',
    category: 'neck',
    position: { x: 50, y: 40 },
  },
  {
    id: 'truss_rod',
    name: 'Truss Rod',
    description: 'A metal rod inside the neck that prevents warping from string tension. It can be adjusted to set neck relief.',
    category: 'neck',
    position: { x: 50, y: 45 },
  },
  
  // Body parts (both)
  {
    id: 'body',
    name: 'Body',
    description: 'The largest part of the guitar. It shapes the resonance and tone. Acoustic bodies are hollow; electric bodies are often solid.',
    category: 'body',
    position: { x: 50, y: 60 },
  },
  {
    id: 'bridge',
    name: 'Bridge',
    description: 'Anchors the strings to the body. It transfers string vibrations to the body and affects sustain and intonation.',
    category: 'body',
    position: { x: 50, y: 75 },
  },
  {
    id: 'saddle',
    name: 'Saddle',
    description: 'The piece on the bridge that strings rest over. Along with the nut, it defines the vibrating length of the string.',
    category: 'body',
    position: { x: 50, y: 78 },
  },
  {
    id: 'strings',
    name: 'Strings',
    description: 'Six strings (E A D G B E in standard tuning) that produce sound when plucked or strung. Thicker strings = lower pitch.',
    category: 'body',
    position: { x: 50, y: 50 },
  },
  
  // Acoustic-specific
  {
    id: 'sound_hole',
    name: 'Sound Hole',
    description: 'The round hole in the body of acoustic guitars. It projects the amplified sound outward.',
    category: 'acoustic',
    position: { x: 50, y: 55 },
  },
  {
    id: 'bridge_pins',
    name: 'Bridge Pins',
    description: 'Small pins that hold the strings in place on acoustic guitar bridges.',
    category: 'acoustic',
    position: { x: 50, y: 80 },
  },
  {
    id: 'pickguard',
    name: 'Pickguard',
    description: 'A protective plate on the body that prevents scratches from the pick.',
    category: 'acoustic',
    position: { x: 35, y: 65 },
  },
  {
    id: 'rosette',
    name: 'Rosette',
    description: 'The decorative ring around the sound hole. It adds visual appeal and can indicate the guitar maker.',
    category: 'acoustic',
    position: { x: 50, y: 58 },
  },
  
  // Electric-specific
  {
    id: 'pickups',
    name: 'Pickups',
    description: 'Magnetic sensors that convert string vibrations into electrical signals. Bridge pickups sound brighter; neck pickups sound warmer.',
    category: 'electric',
    position: { x: 50, y: 65 },
  },
  {
    id: 'pickup_selector',
    name: 'Pickup Selector',
    description: 'A switch that chooses which pickup(s) to use. Common positions: bridge, middle, neck, or combinations.',
    category: 'electric',
    position: { x: 35, y: 70 },
  },
  {
    id: 'volume_knob',
    name: 'Volume Knob',
    description: 'Controls the output level of the guitar signal.',
    category: 'electric',
    position: { x: 35, y: 80 },
  },
  {
    id: 'tone_knob',
    name: 'Tone Knob',
    description: 'Controls the treble frequency. Rolling it off makes the sound warmer/darker.',
    category: 'electric',
    position: { x: 35, y: 85 },
  },
  {
    id: 'output_jack',
    name: 'Output Jack',
    description: 'Where you plug in the cable to connect to an amplifier or audio interface.',
    category: 'electric',
    position: { x: 65, y: 85 },
  },
  {
    id: 'whammy_bar',
    name: 'Whammy Bar',
    description: 'Also called tremolo arm. Allows you to alter string pitch by changing bridge tension.',
    category: 'electric',
    position: { x: 65, y: 75 },
  },
  {
    id: 'cutaway',
    name: 'Cutaway',
    description: 'The scooped area where the neck meets the body. It allows access to higher frets.',
    category: 'electric',
    position: { x: 65, y: 55 },
  },
];

interface GuitarAnatomyProps {
  guitarType: GuitarType;
}

export default function GuitarAnatomy({ guitarType }: GuitarAnatomyProps) {
  const [selectedPart, setSelectedPart] = useState<GuitarPart | null>(null);

  const getVisibleParts = () => {
    const commonParts = GUITAR_PARTS.filter(p => 
      ['headstock', 'neck', 'body'].includes(p.category)
    );
    
    if (guitarType === 'acoustic' || guitarType === 'classical') {
      return [...commonParts, ...GUITAR_PARTS.filter(p => p.category === 'acoustic')];
    } else if (guitarType === 'electric') {
      return [...commonParts, ...GUITAR_PARTS.filter(p => p.category === 'electric')];
    } else {
      // Bass - similar to electric but different parts
      return [...commonParts, ...GUITAR_PARTS.filter(p => p.category === 'electric')];
    }
  };

  const visibleParts = getVisibleParts();

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'headstock': return 'Headstock Area';
      case 'neck': return 'Neck & Fretboard';
      case 'body': return 'Body & Bridge';
      case 'acoustic': return 'Acoustic Parts';
      case 'electric': return 'Electric Parts';
      default: return '';
    }
  };

  const groupedParts = visibleParts.reduce((acc, part) => {
    if (!acc[part.category]) {
      acc[part.category] = [];
    }
    acc[part.category].push(part);
    return acc;
  }, {} as Record<string, GuitarPart[]>);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Guitar Anatomy</Text>
        <Text style={styles.subtitle}>Tap any label to learn more</Text>
        
        <View style={styles.diagramContainer}>
          {/* Simple guitar shape representation */}
          <View style={styles.guitarShape}>
            {/* Headstock */}
            <View style={styles.headstock}>
              <Text style={styles.headstockLabel}>HEADSTOCK</Text>
            </View>
            
            {/* Nut */}
            <View style={styles.nut} />
            
            {/* Neck */}
            <View style={styles.neck}>
              <View style={styles.fretboard}>
                {[1, 2, 3, 4, 5].map((fret) => (
                  <View key={fret} style={styles.fret} />
                ))}
                {/* Inlay dots */}
                <View style={[styles.inlay, { top: '20%' }]} />
                <View style={[styles.inlay, { top: '40%' }]} />
                <View style={[styles.inlay, { top: '60%' }]} />
              </View>
            </View>
            
            {/* Body */}
            <View style={[styles.body, guitarType === 'acoustic' ? styles.acousticBody : styles.electricBody]}>
              {guitarType === 'acoustic' && (
                <View style={styles.soundHole} />
              )}
              {guitarType === 'electric' && (
                <>
                  <View style={styles.pickup} />
                  <View style={[styles.pickup, { top: '45%' }]} />
                </>
              )}
              <View style={styles.bridge} />
            </View>
          </View>
          
          {/* Labels */}
          {visibleParts.map((part) => (
            <TouchableOpacity
              key={part.id}
              style={[
                styles.label,
                {
                  left: `${part.position.x}%`,
                  top: `${part.position.y}%`,
                },
                selectedPart?.id === part.id && styles.labelSelected,
              ]}
              onPress={() => setSelectedPart(selectedPart?.id === part.id ? null : part)}
            >
              <Text style={styles.labelText}>{part.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected part description */}
        {selectedPart && (
          <View style={[styles.descriptionCard, CARD_SHADOW]}>
            <Text style={styles.descriptionTitle}>{selectedPart.name}</Text>
            <Text style={styles.descriptionText}>{selectedPart.description}</Text>
          </View>
        )}

        {/* Parts list by category */}
        {Object.entries(groupedParts).map(([category, parts]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{getCategoryLabel(category)}</Text>
            {parts.map((part) => (
              <TouchableOpacity
                key={part.id}
                style={[
                  styles.partItem,
                  selectedPart?.id === part.id && styles.partItemSelected,
                ]}
                onPress={() => setSelectedPart(selectedPart?.id === part.id ? null : part)}
              >
                <Text style={styles.partName}>{part.name}</Text>
                <Text style={styles.partPreview} numberOfLines={1}>
                  {part.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: Colors.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: Colors.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.muted,
    marginBottom: Colors.spacing.lg,
  },
  diagramContainer: {
    height: 400,
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.lg,
    marginBottom: Colors.spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  guitarShape: {
    flex: 1,
    alignItems: 'center',
    padding: Colors.spacing.md,
  },
  headstock: {
    width: 60,
    height: 40,
    backgroundColor: '#8B4513',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headstockLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
  },
  nut: {
    width: 70,
    height: 4,
    backgroundColor: '#f5f5dc',
  },
  neck: {
    width: 60,
    flex: 1,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fretboard: {
    width: 50,
    flex: 1,
    backgroundColor: '#3d2b1f',
    position: 'relative',
  },
  fret: {
    height: 2,
    backgroundColor: '#c0c0c0',
    marginVertical: 8,
  },
  inlay: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -4 }],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  body: {
    width: 120,
    height: 160,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  acousticBody: {
    backgroundColor: '#deb887',
  },
  electricBody: {
    backgroundColor: '#4a4a4a',
  },
  soundHole: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    position: 'absolute',
    top: '30%',
  },
  pickup: {
    width: 40,
    height: 8,
    backgroundColor: '#c0c0c0',
    position: 'absolute',
    top: '35%',
    borderRadius: 4,
  },
  bridge: {
    width: 30,
    height: 20,
    backgroundColor: '#3d2b1f',
    position: 'absolute',
    bottom: '20%',
    borderRadius: 4,
  },
  label: {
    position: 'absolute',
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    transform: [{ translateX: -50 }],
    zIndex: 10,
  },
  labelSelected: {
    backgroundColor: Colors.warning,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  descriptionCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.lg,
    padding: Colors.spacing.lg,
    marginBottom: Colors.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: Colors.spacing.sm,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.dark.muted,
    lineHeight: 20,
  },
  categorySection: {
    marginBottom: Colors.spacing.lg,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: Colors.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  partItem: {
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.md,
    padding: Colors.spacing.md,
    marginBottom: Colors.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  partItemSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  partName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  partPreview: {
    fontSize: 13,
    color: Colors.dark.muted,
  },
});
