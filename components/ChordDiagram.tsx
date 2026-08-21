import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../constants/Colors';
import { Chord } from '../features/chords/data/chords';

const FRETBOARD_STRING_COUNT = 6;
const FRET_COUNT = 5;

export default function ChordDiagram({ chord, small }: { chord: Chord; small?: boolean }) {
  const color = Colors.dark;
  // Finger-dot radius drives all other proportions.
  const dotR = small ? 7 : 14;
  const boardW = small ? 82 : 150;
  const boardH = small ? 92 : 168;
  const nutH = small ? 5 : 7;
  const markerH = small ? 17 : 26; // X / O row above the nut
  const lineW = small ? 1.5 : 2;
  const cellH = boardH / FRET_COUNT;
  const cellW = boardW / (FRETBOARD_STRING_COUNT - 1);
  const pad = dotR + 1; // room for dots on the outer strings
  const gridColor = color.muted;
  const boardTop = markerH + nutH;
  const openR = small ? 4.5 : 8;

  return (
    <View style={{ width: boardW + pad * 2, height: boardTop + boardH + lineW }}>
      {/* Nut — bold bar across the top */}
      <View
        style={{
          position: 'absolute',
          top: markerH,
          left: pad - lineW,
          width: boardW + lineW * 2,
          height: nutH,
          borderRadius: nutH / 3,
          backgroundColor: color.tint,
        }}
      />
      {/* Frets */}
      {[...Array(FRET_COUNT)].map((_, i) => (
        <View
          key={`fret-${i}`}
          style={{
            position: 'absolute',
            top: boardTop + (i + 1) * cellH - lineW,
            left: pad,
            width: boardW,
            height: lineW,
            backgroundColor: gridColor,
          }}
        />
      ))}
      {/* Strings */}
      {[...Array(FRETBOARD_STRING_COUNT)].map((_, i) => (
        <View
          key={`string-${i}`}
          style={{
            position: 'absolute',
            left: pad + i * cellW - lineW / 2,
            top: boardTop,
            height: boardH,
            width: lineW,
            backgroundColor: gridColor,
          }}
        />
      ))}
      {chord.strings.map((fret, stringIdx) => {
        const cx = pad + stringIdx * cellW;
        if (fret === -1) {
          return (
            <Text
              key={`x-${stringIdx}`}
              style={{
                position: 'absolute',
                left: cx - dotR,
                top: 0,
                width: dotR * 2,
                height: markerH,
                lineHeight: markerH - (small ? 3 : 4),
                textAlign: 'center',
                color: color.text,
                fontSize: small ? 12 : 18,
                fontWeight: '800',
              }}
            >
              ×
            </Text>
          );
        }
        if (fret === 0) {
          return (
            <View
              key={`open-${stringIdx}`}
              style={{
                position: 'absolute',
                left: cx - openR,
                top: (markerH - nutH) / 2 - openR,
                width: openR * 2,
                height: openR * 2,
                borderRadius: openR,
                borderWidth: small ? 1.5 : 2,
                borderColor: color.text,
                backgroundColor: 'transparent',
              }}
            />
          );
        }
        const finger = chord.fingers[stringIdx];
        return (
          <View
            key={`dot-${stringIdx}`}
            style={{
              position: 'absolute',
              left: cx - dotR,
              top: boardTop + (fret - 0.5) * cellH - dotR,
              width: dotR * 2,
              height: dotR * 2,
              borderRadius: dotR,
              backgroundColor: Colors.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {finger > 0 && (
              <Text
                style={{
                  color: color.background,
                  fontSize: small ? 10 : 15,
                  fontWeight: '800',
                  lineHeight: small ? 13 : 19,
                }}
              >
                {finger}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
