import { Drill } from '../lessons/data/drills';
import { Song } from './data/songs';

export const SONG_PRACTICE_PREFIX = 'song-practice:';

export function songPracticeScoreKey(songId: string): string {
  return `${SONG_PRACTICE_PREFIX}${songId}`;
}

/**
 * Builds an original chord-set exercise from a song reference. This is
 * intentionally not a transcription, tempo map, or reconstruction of the
 * copyrighted recording's arrangement.
 */
export function buildSongPracticeDrill(song: Song): Drill {
  const pass = song.chords.map((chordName) => ({
    kind: 'chord' as const,
    chordName,
    label: chordName,
  }));

  return {
    lessonId: songPracticeScoreKey(song.id),
    title: `${song.title} · Chord Practice`,
    intro:
      'This is an original chord-set exercise, not the song arrangement. Play every required chord twice through. Wait mode follows your pace; Flow mode keeps the changes moving.',
    targets: [...pass, ...pass.map((target) => ({ ...target }))],
    defaultMode: 'poly',
    secondsPerTarget: 6,
  };
}
