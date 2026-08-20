import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';

interface HeadstockProps {
  guitarType?: 'acoustic' | 'electric';
  highlightColor?: string;
  highlightedPeg?: number;
}

export function AcousticHeadstock({ highlightColor = '#4CAF50', highlightedPeg }: HeadstockProps) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={200} height={320} viewBox="0 0 200 320" accessibilityLabel="Acoustic guitar headstock">
        <Defs>
          <LinearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#8B6914" />
            <Stop offset="0.5" stopColor="#A0782C" />
            <Stop offset="1" stopColor="#6B4F12" />
          </LinearGradient>
        </Defs>

        {/* Headstock body */}
        <Rect x={50} y={0} width={100} height={200} rx={10} fill="url(#wood)" />

        {/* Nut */}
        <Rect x={45} y={195} width={110} height={8} rx={2} fill="#F5F5DC" />

        {/* String pegs - left side (3) */}
        {[60, 90, 120].map((y, i) => (
          <React.Fragment key={`left-${i}`}>
            <Ellipse
              cx={52}
              cy={y}
              rx={8}
              ry={8}
              fill={highlightedPeg === i ? highlightColor : '#C0C0C0'}
              stroke="#888"
              strokeWidth={1}
            />
            <Line x1={52} y1={y} x2={100} y2={y + 50} stroke="#ddd" strokeWidth={1} />
          </React.Fragment>
        ))}

        {/* String pegs - right side (3) */}
        {[60, 90, 120].map((y, i) => (
          <React.Fragment key={`right-${i}`}>
            <Ellipse
              cx={148}
              cy={y}
              rx={8}
              ry={8}
              fill={highlightedPeg === i + 3 ? highlightColor : '#C0C0C0'}
              stroke="#888"
              strokeWidth={1}
            />
            <Line x1={148} y1={y} x2={100} y2={y + 50} stroke="#ddd" strokeWidth={1} />
          </React.Fragment>
        ))}

        {/* Strings */}
        {[72, 84, 96, 104, 116, 128].map((x, i) => (
          <Line key={`string-${i}`} x1={x} y1={203} x2={x} y2={320} stroke="#ddd" strokeWidth={1.5 - i * 0.15} />
        ))}
      </Svg>
    </View>
  );
}

export function ElectricHeadstock({ highlightColor = '#4CAF50', highlightedPeg }: HeadstockProps) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={200} height={320} viewBox="0 0 200 320" accessibilityLabel="Electric guitar headstock">
        <Defs>
          <LinearGradient id="ewood" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1a1a1a" />
            <Stop offset="0.5" stopColor="#2d2d2d" />
            <Stop offset="1" stopColor="#111111" />
          </LinearGradient>
        </Defs>

        {/* Headstock body - pointed shape */}
        <Rect x={55} y={0} width={90} height={210} rx={5} fill="url(#ewood)" />

        {/* Nut */}
        <Rect x={50} y={205} width={100} height={6} rx={2} fill="#E0E0E0" />

        {/* Tuning pegs - inline (3 per side) */}
        {[50, 90, 130].map((y, i) => (
          <React.Fragment key={`el-${i}`}>
            <Ellipse
              cx={60}
              cy={y}
              rx={7}
              ry={7}
              fill={highlightedPeg === i ? highlightColor : '#aaa'}
              stroke="#666"
              strokeWidth={1}
            />
            <Line x1={60} y1={y} x2={100} y2={y + 55} stroke="#999" strokeWidth={1} />
          </React.Fragment>
        ))}
        {[50, 90, 130].map((y, i) => (
          <React.Fragment key={`er-${i}`}>
            <Ellipse
              cx={140}
              cy={y}
              rx={7}
              ry={7}
              fill={highlightedPeg === i + 3 ? highlightColor : '#aaa'}
              stroke="#666"
              strokeWidth={1}
            />
            <Line x1={140} y1={y} x2={100} y2={y + 55} stroke="#999" strokeWidth={1} />
          </React.Fragment>
        ))}

        {/* Strings */}
        {[74, 86, 96, 104, 114, 126].map((x, i) => (
          <Line key={`estring-${i}`} x1={x} y1={211} x2={x} y2={320} stroke="#bbb" strokeWidth={1.5 - i * 0.15} />
        ))}
      </Svg>
    </View>
  );
}

export default function HeadstockSvg({ guitarType = 'acoustic', ...props }: HeadstockProps & { guitarType?: 'acoustic' | 'electric' }) {
  if (guitarType === 'electric') {
    return <ElectricHeadstock {...props} />;
  }
  return <AcousticHeadstock {...props} />;
}
