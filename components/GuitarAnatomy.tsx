import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { Colors, CARD_SHADOW } from '../constants/Colors';
import { GuitarType } from '../features/store/userPreferencesStore';

interface GuitarPart {
  id: string;
  name: string;
  description: string;
  category: 'headstock' | 'neck' | 'body' | 'acoustic' | 'electric';
}

const GUITAR_PARTS: GuitarPart[] = [
  // Headstock parts
  {
    id: 'headstock',
    name: 'Headstock',
    description:
      'The top of the guitar where tuning machines are mounted. It anchors the strings and helps maintain tuning stability.',
    category: 'headstock',
  },
  {
    id: 'tuning_machines',
    name: 'Tuning Machines',
    description:
      'Also called tuning pegs or machine heads. These allow you to adjust string tension to tune each string.',
    category: 'headstock',
  },
  {
    id: 'nut',
    name: 'Nut',
    description:
      'A small notched piece at the top of the fretboard. It guides the strings and defines one end of the vibrating string length.',
    category: 'headstock',
  },

  // Neck parts
  {
    id: 'neck',
    name: 'Neck',
    description:
      'The long piece connecting the headstock to the body. Your fretting hand holds the neck while playing.',
    category: 'neck',
  },
  {
    id: 'fretboard',
    name: 'Fretboard',
    description:
      'Also called fingerboard. The thin piece of wood on top of the neck where you press strings to play notes and chords.',
    category: 'neck',
  },
  {
    id: 'frets',
    name: 'Frets',
    description:
      'Metal strips on the fretboard that divide it into fixed pitch positions. Pressing behind a fret changes the note.',
    category: 'neck',
  },
  {
    id: 'inlays',
    name: 'Inlays',
    description:
      'Markers (usually dots) at the 3rd, 5th, 7th, 9th, and 12th frets. They help you navigate the fretboard.',
    category: 'neck',
  },
  {
    id: 'truss_rod',
    name: 'Truss Rod',
    description:
      'A metal rod inside the neck that prevents warping from string tension. It can be adjusted to set neck relief.',
    category: 'neck',
  },

  // Body parts (both)
  {
    id: 'body',
    name: 'Body',
    description:
      'The largest part of the guitar. It shapes the resonance and tone. Acoustic bodies are hollow; electric bodies are often solid.',
    category: 'body',
  },
  {
    id: 'bridge',
    name: 'Bridge',
    description:
      'Anchors the strings to the body. It transfers string vibrations to the body and affects sustain and intonation.',
    category: 'body',
  },
  {
    id: 'saddle',
    name: 'Saddle',
    description:
      'The piece on the bridge that strings rest over. Along with the nut, it defines the vibrating length of the string.',
    category: 'body',
  },
  {
    id: 'strings',
    name: 'Strings',
    description:
      'Six strings (E A D G B E in standard tuning) that produce sound when plucked or strummed. Thicker strings = lower pitch.',
    category: 'body',
  },

  // Acoustic-specific
  {
    id: 'sound_hole',
    name: 'Sound Hole',
    description:
      'The round hole in the body of acoustic guitars. It projects the amplified sound outward.',
    category: 'acoustic',
  },
  {
    id: 'bridge_pins',
    name: 'Bridge Pins',
    description: 'Small pins that hold the strings in place on acoustic guitar bridges.',
    category: 'acoustic',
  },
  {
    id: 'pickguard',
    name: 'Pickguard',
    description: 'A protective plate on the body that prevents scratches from the pick.',
    category: 'acoustic',
  },
  {
    id: 'rosette',
    name: 'Rosette',
    description:
      'The decorative ring around the sound hole. It adds visual appeal and can indicate the guitar maker.',
    category: 'acoustic',
  },

  // Electric-specific
  {
    id: 'pickups',
    name: 'Pickups',
    description:
      'Magnetic sensors that convert string vibrations into electrical signals. Bridge pickups sound brighter; neck pickups sound warmer.',
    category: 'electric',
  },
  {
    id: 'pickup_selector',
    name: 'Pickup Selector',
    description:
      'A switch that chooses which pickup(s) to use. Common positions: bridge, middle, neck, or combinations.',
    category: 'electric',
  },
  {
    id: 'volume_knob',
    name: 'Volume Knob',
    description: 'Controls the output level of the guitar signal.',
    category: 'electric',
  },
  {
    id: 'tone_knob',
    name: 'Tone Knob',
    description: 'Controls the treble frequency. Rolling it off makes the sound warmer/darker.',
    category: 'electric',
  },
  {
    id: 'output_jack',
    name: 'Output Jack',
    description: 'Where you plug in the cable to connect to an amplifier or audio interface.',
    category: 'electric',
  },
  {
    id: 'whammy_bar',
    name: 'Whammy Bar',
    description:
      'Also called tremolo arm. Allows you to alter string pitch by changing bridge tension.',
    category: 'electric',
  },
  {
    id: 'cutaway',
    name: 'Cutaway',
    description:
      'The scooped area where the neck meets the body. It allows access to higher frets.',
    category: 'electric',
  },
];

/** Hotspot positions in the 300x560 diagram viewBox, per guitar style. */
const HOTSPOTS: Record<'acoustic' | 'electric', Record<string, { x: number; y: number }>> = {
  acoustic: {
    headstock: { x: 150, y: 38 },
    tuning_machines: { x: 187, y: 52 },
    nut: { x: 150, y: 92 },
    neck: { x: 122, y: 122 },
    fretboard: { x: 150, y: 165 },
    frets: { x: 178, y: 208 },
    inlays: { x: 150, y: 243 },
    truss_rod: { x: 122, y: 262 },
    strings: { x: 150, y: 305 },
    body: { x: 62, y: 470 },
    sound_hole: { x: 150, y: 372 },
    rosette: { x: 188, y: 355 },
    pickguard: { x: 212, y: 402 },
    bridge: { x: 108, y: 470 },
    saddle: { x: 150, y: 458 },
    bridge_pins: { x: 150, y: 482 },
  },
  electric: {
    headstock: { x: 150, y: 38 },
    tuning_machines: { x: 187, y: 52 },
    nut: { x: 150, y: 92 },
    neck: { x: 122, y: 122 },
    fretboard: { x: 150, y: 165 },
    frets: { x: 178, y: 208 },
    inlays: { x: 150, y: 243 },
    truss_rod: { x: 122, y: 262 },
    strings: { x: 150, y: 300 },
    body: { x: 70, y: 480 },
    cutaway: { x: 213, y: 302 },
    pickups: { x: 150, y: 372 },
    pickup_selector: { x: 96, y: 428 },
    bridge: { x: 108, y: 442 },
    saddle: { x: 150, y: 434 },
    whammy_bar: { x: 187, y: 458 },
    volume_knob: { x: 205, y: 470 },
    tone_knob: { x: 222, y: 498 },
    output_jack: { x: 238, y: 522 },
  },
};

const QUIZ_ROUNDS = 8;
const QUIZ_PASS = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shared drawing for headstock, neck, and strings (identical for both styles). */
function NeckAndHeadstock() {
  return (
    <>
      {/* Headstock */}
      <Rect x={122} y={12} width={56} height={78} rx={8} fill="#8B6914" />
      {/* Tuning machine pegs */}
      {[30, 52, 74].map((y) => (
        <React.Fragment key={y}>
          <Circle cx={116} cy={y} r={6} fill="#C0C0C0" stroke="#777" strokeWidth={1} />
          <Circle cx={184} cy={y} r={6} fill="#C0C0C0" stroke="#777" strokeWidth={1} />
        </React.Fragment>
      ))}
      {/* Nut */}
      <Rect x={120} y={88} width={60} height={6} rx={2} fill="#F5F5DC" />
      {/* Neck / fretboard */}
      <Rect x={126} y={94} width={48} height={196} fill="#3d2b1f" />
      {/* Frets */}
      {[120, 148, 176, 204, 232, 260, 288].map((y) => (
        <Line key={y} x1={126} y1={y} x2={174} y2={y} stroke="#b8b8b8" strokeWidth={2} />
      ))}
      {/* Inlays */}
      {[162, 218, 274].map((y) => (
        <Circle key={y} cx={150} cy={y} r={4} fill="#ece9e2" />
      ))}
    </>
  );
}

function GuitarStrings({ bottomY }: { bottomY: number }) {
  return (
    <>
      {[130, 138, 146, 154, 162, 170].map((x, i) => (
        <Line
          key={x}
          x1={x}
          y1={92}
          x2={x}
          y2={bottomY}
          stroke="#d8d8d8"
          strokeWidth={1.6 - i * 0.18}
        />
      ))}
    </>
  );
}

function AcousticDiagramShapes() {
  return (
    <>
      {/* Body: waisted acoustic outline */}
      <Path
        d="M 150 290
           C 95 290 70 315 68 350
           C 66 382 88 392 88 412
           C 88 438 60 448 60 486
           C 60 528 100 548 150 548
           C 200 548 240 528 240 486
           C 240 448 212 438 212 412
           C 212 392 234 382 232 350
           C 230 315 205 290 150 290 Z"
        fill="#C89B5A"
        stroke="#8B6914"
        strokeWidth={3}
      />
      {/* Pickguard */}
      <Path
        d="M 186 380 C 214 388 222 410 210 424 C 198 436 180 428 174 410 Z"
        fill="rgba(30,20,15,0.55)"
      />
      {/* Rosette + sound hole */}
      <Circle cx={150} cy={372} r={36} fill="none" stroke="#6B4F12" strokeWidth={6} />
      <Circle cx={150} cy={372} r={30} fill="#171310" />
      {/* Bridge */}
      <Rect x={116} y={456} width={68} height={26} rx={6} fill="#3d2b1f" />
      {/* Saddle */}
      <Rect x={124} y={460} width={52} height={4} rx={2} fill="#F5F5DC" />
      {/* Bridge pins */}
      {[130, 138, 146, 154, 162, 170].map((x) => (
        <Circle key={x} cx={x} cy={474} r={2.5} fill="#ece9e2" />
      ))}
      <GuitarStrings bottomY={462} />
    </>
  );
}

function ElectricDiagramShapes() {
  return (
    <>
      {/* Body: double-cutaway solid body */}
      <Path
        d="M 150 292
           C 128 292 124 306 108 306
           C 78 306 58 336 58 380
           C 58 440 70 470 70 490
           C 70 524 108 544 152 544
           C 200 544 236 526 240 492
           C 243 464 232 448 232 420
           C 232 392 244 372 240 344
           C 236 314 216 306 194 306
           C 176 306 172 292 150 292 Z"
        fill="#37374a"
        stroke="#1f1f2e"
        strokeWidth={3}
      />
      {/* Pickups */}
      <Rect x={124} y={352} width={52} height={14} rx={4} fill="#C0C0C0" />
      <Rect x={124} y={392} width={52} height={14} rx={4} fill="#C0C0C0" />
      {/* Pickup selector */}
      <Circle cx={96} cy={428} r={5} fill="#C0C0C0" />
      <Line x1={96} y1={428} x2={88} y2={416} stroke="#C0C0C0" strokeWidth={3} />
      {/* Bridge + saddle */}
      <Rect x={118} y={428} width={64} height={16} rx={4} fill="#8a8a8a" />
      <Rect x={124} y={430} width={52} height={4} rx={2} fill="#dcdcdc" />
      {/* Whammy bar */}
      <Path d="M 178 444 C 196 452 202 464 198 478" stroke="#C0C0C0" strokeWidth={4} fill="none" />
      {/* Knobs */}
      <Circle cx={205} cy={470} r={9} fill="#C0C0C0" stroke="#777" strokeWidth={1} />
      <Circle cx={222} cy={498} r={9} fill="#C0C0C0" stroke="#777" strokeWidth={1} />
      {/* Output jack */}
      <Circle cx={238} cy={522} r={6} fill="#111" stroke="#C0C0C0" strokeWidth={2} />
      <GuitarStrings bottomY={432} />
    </>
  );
}

type QuizState =
  | { phase: 'idle' }
  | {
      phase: 'asking';
      round: number;
      score: number;
      questionId: string;
      options: string[]; // part ids
      answered: string | null; // selected part id, shown briefly before advancing
    }
  | { phase: 'done'; score: number };

interface GuitarAnatomyProps {
  guitarType: GuitarType;
  /** Called when the quiz is passed, with the score as a percentage. */
  onQuizPassed?: (scorePercent: number) => void;
}

export default function GuitarAnatomy({ guitarType, onQuizPassed }: GuitarAnatomyProps) {
  const [selectedPart, setSelectedPart] = useState<GuitarPart | null>(null);
  const [quiz, setQuiz] = useState<QuizState>({ phase: 'idle' });
  const [quizOrder, setQuizOrder] = useState<GuitarPart[]>([]);

  // Classical shares the acoustic body and headstock closely enough to use
  // the same diagram.
  const diagramStyle: 'acoustic' | 'electric' =
    guitarType === 'electric' ? 'electric' : 'acoustic';

  const visibleParts = useMemo(() => {
    const common = GUITAR_PARTS.filter((p) =>
      ['headstock', 'neck', 'body'].includes(p.category),
    );
    const specific = GUITAR_PARTS.filter((p) => p.category === diagramStyle);
    return [...common, ...specific];
  }, [diagramStyle]);

  const hotspots = HOTSPOTS[diagramStyle];
  const partNumber = useMemo(() => {
    const map: Record<string, number> = {};
    visibleParts.forEach((p, i) => {
      map[p.id] = i + 1;
    });
    return map;
  }, [visibleParts]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'headstock':
        return 'Headstock Area';
      case 'neck':
        return 'Neck & Fretboard';
      case 'body':
        return 'Body & Bridge';
      case 'acoustic':
        return 'Acoustic Parts';
      case 'electric':
        return 'Electric Parts';
      default:
        return '';
    }
  };

  const groupedParts = useMemo(
    () =>
      visibleParts.reduce((acc, part) => {
        (acc[part.category] ??= []).push(part);
        return acc;
      }, {} as Record<string, GuitarPart[]>),
    [visibleParts],
  );

  const togglePart = useCallback((part: GuitarPart) => {
    setSelectedPart((prev) => (prev?.id === part.id ? null : part));
  }, []);

  // --- Quiz logic ---
  const startQuiz = useCallback(() => {
    const order = shuffle(visibleParts).slice(0, QUIZ_ROUNDS);
    setQuizOrder(order);
    setSelectedPart(null);
    setQuiz({
      phase: 'asking',
      round: 0,
      score: 0,
      questionId: order[0].id,
      options: shuffle([
        order[0].id,
        ...shuffle(visibleParts.filter((p) => p.id !== order[0].id))
          .slice(0, 3)
          .map((p) => p.id),
      ]),
      answered: null,
    });
  }, [visibleParts]);

  const answerQuiz = useCallback(
    (answerId: string) => {
      if (quiz.phase !== 'asking' || quiz.answered !== null) return;
      const correct = answerId === quiz.questionId;
      const newScore = quiz.score + (correct ? 1 : 0);
      setQuiz({ ...quiz, answered: answerId, score: newScore });

      setTimeout(() => {
        const nextRound = quiz.round + 1;
        if (nextRound >= quizOrder.length) {
          setQuiz({ phase: 'done', score: newScore });
          if (newScore >= QUIZ_PASS) {
            onQuizPassed?.(Math.round((newScore / quizOrder.length) * 100));
          }
        } else {
          const q = quizOrder[nextRound];
          setQuiz({
            phase: 'asking',
            round: nextRound,
            score: newScore,
            questionId: q.id,
            options: shuffle([
              q.id,
              ...shuffle(visibleParts.filter((p) => p.id !== q.id))
                .slice(0, 3)
                .map((p) => p.id),
            ]),
            answered: null,
          });
        }
      }, 900);
    },
    [quiz, quizOrder, visibleParts, onQuizPassed],
  );

  const quizActive = quiz.phase === 'asking';
  const quizHighlightId = quizActive ? quiz.questionId : null;
  const partById = (id: string) => GUITAR_PARTS.find((p) => p.id === id)!;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Guitar Anatomy</Text>
        <Text style={styles.subtitle}>
          {quizActive
            ? 'Which part is highlighted?'
            : 'Tap a numbered dot or a list item to learn more'}
        </Text>

        <View style={styles.diagramContainer}>
          <Svg
            width="100%"
            height={430}
            viewBox="0 0 300 560"
            accessibilityLabel={`${diagramStyle} guitar diagram with numbered parts`}
          >
            {diagramStyle === 'acoustic' ? (
              <AcousticDiagramShapes />
            ) : (
              <ElectricDiagramShapes />
            )}
            <NeckAndHeadstock />

            {/* Hotspots */}
            {visibleParts.map((part) => {
              const pos = hotspots[part.id];
              if (!pos) return null;
              const isSelected = selectedPart?.id === part.id;
              const isQuizTarget = quizHighlightId === part.id;
              // During the quiz, hide numbers so the answer isn't given away.
              const fill = isQuizTarget
                ? Colors.warning
                : isSelected
                ? Colors.success
                : 'rgba(15,15,35,0.88)';
              return (
                <React.Fragment key={part.id}>
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={11}
                    fill={fill}
                    stroke={isSelected || isQuizTarget ? '#fff' : Colors.success}
                    strokeWidth={isQuizTarget ? 2.5 : 1.5}
                    onPress={quizActive ? undefined : () => togglePart(part)}
                  />
                  <SvgText
                    x={pos.x}
                    y={pos.y + 4}
                    fontSize={11}
                    fontWeight="bold"
                    fill="#fff"
                    textAnchor="middle"
                    onPress={quizActive ? undefined : () => togglePart(part)}
                  >
                    {isQuizTarget ? '?' : quizActive ? '' : String(partNumber[part.id])}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        {/* Quiz card */}
        {quiz.phase === 'idle' && (
          <TouchableOpacity
            style={[styles.quizStartButton, CARD_SHADOW]}
            onPress={startQuiz}
            accessibilityRole="button"
            accessibilityLabel="Start the anatomy quiz"
          >
            <Text style={styles.quizStartText}>Test Yourself ({QUIZ_ROUNDS} questions)</Text>
          </TouchableOpacity>
        )}

        {quiz.phase === 'asking' && (
          <View style={[styles.quizCard, CARD_SHADOW]}>
            <View style={styles.quizHeader}>
              <Text style={styles.quizProgress}>
                Question {quiz.round + 1}/{quizOrder.length}
              </Text>
              <Text style={styles.quizScore}>Score: {quiz.score}</Text>
            </View>
            {quiz.options.map((optionId) => {
              const isAnswered = quiz.answered !== null;
              const isCorrectOption = optionId === quiz.questionId;
              const isChosen = quiz.answered === optionId;
              return (
                <TouchableOpacity
                  key={optionId}
                  style={[
                    styles.quizOption,
                    isAnswered && isCorrectOption && styles.quizOptionCorrect,
                    isAnswered && isChosen && !isCorrectOption && styles.quizOptionWrong,
                  ]}
                  onPress={() => answerQuiz(optionId)}
                  disabled={isAnswered}
                  accessibilityRole="button"
                  accessibilityLabel={partById(optionId).name}
                >
                  <Text style={styles.quizOptionText}>{partById(optionId).name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {quiz.phase === 'done' && (
          <View style={[styles.quizCard, CARD_SHADOW]}>
            <Text style={styles.quizDoneTitle}>
              {quiz.score >= QUIZ_PASS ? 'Nice work!' : 'Keep studying!'}
            </Text>
            <Text style={styles.quizDoneScore}>
              You got {quiz.score} of {quizOrder.length} right
              {quiz.score >= QUIZ_PASS
                ? onQuizPassed
                  ? ' — lesson marked complete!'
                  : ' — you know your way around a guitar.'
                : ` — review the parts below and try again. ${QUIZ_PASS} correct is a pass.`}
            </Text>
            <TouchableOpacity
              style={styles.quizRetryButton}
              onPress={startQuiz}
              accessibilityRole="button"
              accessibilityLabel="Retry the quiz"
            >
              <Text style={styles.quizRetryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Selected part description */}
        {selectedPart && !quizActive && (
          <View style={[styles.descriptionCard, CARD_SHADOW]}>
            <View style={styles.descriptionHeader}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberBadgeText}>{partNumber[selectedPart.id]}</Text>
              </View>
              <Text style={styles.descriptionTitle}>{selectedPart.name}</Text>
            </View>
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
                onPress={() => togglePart(part)}
                accessibilityRole="button"
                accessibilityLabel={`${part.name}. ${part.description}`}
              >
                <View style={styles.partRow}>
                  <View style={styles.numberBadgeSmall}>
                    <Text style={styles.numberBadgeSmallText}>{partNumber[part.id]}</Text>
                  </View>
                  <View style={styles.partTextColumn}>
                    <Text style={styles.partName}>{part.name}</Text>
                    <Text style={styles.partPreview} numberOfLines={1}>
                      {part.description}
                    </Text>
                  </View>
                </View>
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
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.lg,
    marginBottom: Colors.spacing.lg,
    paddingVertical: Colors.spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  quizStartButton: {
    backgroundColor: Colors.success,
    borderRadius: Colors.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Colors.spacing.lg,
  },
  quizStartText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#071408',
  },
  quizCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.lg,
    padding: Colors.spacing.lg,
    marginBottom: Colors.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Colors.spacing.md,
  },
  quizProgress: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  quizScore: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  quizOption: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Colors.radius.md,
    paddingVertical: 12,
    paddingHorizontal: Colors.spacing.md,
    marginBottom: Colors.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  quizOptionCorrect: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(76,175,80,0.18)',
  },
  quizOptionWrong: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(244,67,54,0.18)',
  },
  quizOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  quizDoneTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: Colors.spacing.sm,
  },
  quizDoneScore: {
    fontSize: 14,
    color: Colors.dark.muted,
    lineHeight: 20,
    marginBottom: Colors.spacing.md,
  },
  quizRetryButton: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: Colors.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quizRetryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
  },
  descriptionCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.lg,
    padding: Colors.spacing.lg,
    marginBottom: Colors.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Colors.spacing.sm,
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071408',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
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
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  numberBadgeSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  partTextColumn: {
    flex: 1,
  },
  partName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  partPreview: {
    fontSize: 13,
    color: Colors.dark.muted,
  },
});
