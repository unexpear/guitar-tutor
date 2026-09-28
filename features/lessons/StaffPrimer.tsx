import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Ellipse, Text as SvgText, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { STAFF_PRIMER, type PrimerClef } from './data/notationPrimer';

export default function StaffPrimer({ clef }: { clef: PrimerClef }) {
  const notes = STAFF_PRIMER[clef];
  const description = `${clef === 'bass' ? 'Bass' : 'Treble'} clef, open strings: ${notes.map(note => `${note.string} is written ${note.written}`).join('; ')}. Each sounds one octave lower than written.`;
  return <View style={styles.box}>
    <Text style={styles.title}>{clef === 'bass' ? 'Bass' : 'Treble'} clef · open strings</Text>
    <View style={styles.staff} accessible accessibilityLabel={description}>
      <View style={styles.clef}><MaterialCommunityIcons name={clef === 'bass' ? 'music-clef-bass' : 'music-clef-treble'} size={42} color={Colors.dark.text} /></View>
      <Svg width="100%" height={132} viewBox="0 0 300 120" accessible={false}>
        {[24, 36, 48, 60, 72].map(y => <Line key={y} x1={42} x2={295} y1={y} y2={y} stroke={Colors.dark.muted} strokeWidth={1} />)}
        {notes.map((note, index) => {
          const x = 74 + index * (200 / (notes.length - 1));
          const y = 72 - note.staffSteps * 6;
          return <G key={note.string}>
            {y > 72 && <Line x1={x - 14} x2={x + 14} y1={84} y2={84} stroke={Colors.dark.muted} strokeWidth={1} />}
            <Ellipse cx={x} cy={y} rx={8} ry={5} fill={Colors.success} />
            <Line x1={x + (y >= 48 ? 7 : -7)} x2={x + (y >= 48 ? 7 : -7)} y1={y} y2={y + (y >= 48 ? -28 : 28)} stroke={Colors.success} strokeWidth={2} />
            <SvgText x={x} y={106} textAnchor="middle" fontSize={12} fill={Colors.dark.text}>{note.string}</SvgText>
          </G>;
        })}
      </Svg>
    </View>
    <Text style={styles.caption}>Read left to right. These quarter notes each last one beat in 4/4. Labels name the open strings.</Text>
    {notes.map(note => <Text key={note.string} style={styles.caption}>Open {note.string} → written {note.written}</Text>)}
  </View>;
}
const styles = StyleSheet.create({
  box: { backgroundColor: Colors.dark.surfaceElevated, padding: 12, borderRadius: 12, marginBottom: 16, gap: 8 },
  staff: { width: '100%' }, clef: { position: 'absolute', left: 0, top: 24 },
  title: { color: Colors.dark.text, fontSize: 16, fontWeight: '700' },
  caption: { color: Colors.dark.muted, fontSize: 14, lineHeight: 21 },
});
