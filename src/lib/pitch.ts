export type Transposition = 'concert' | 'bb' | 'eb' | 'f';
const offsets: Record<Transposition, number> = { concert: 0, bb: 2, eb: 9, f: 7 };
const notes = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
export function frequencyToPitch(frequency: number, transposition: Transposition = 'concert'): { note: string; cents: number } | null {
  if (!Number.isFinite(frequency) || frequency < 55 || frequency > 2000) return null;
  const exact = 69 + 12 * Math.log2(frequency / 440);
  const sounding = Math.round(exact);
  const written = sounding + offsets[transposition];
  return { note: `${notes[written % 12]}${Math.floor(written / 12) - 1}`, cents: Math.round((exact - sounding) * 100) || 0 };
}
