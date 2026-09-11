import {
  CLICK_RHYTHMS,
  clickIntervalMs,
  getBeatPhaseCount,
  getBeatStride,
} from '@/lib/click-rhythm';

describe('click rhythms', () => {
  test('offers the six note types in musical order', () => {
    expect(CLICK_RHYTHMS.map(({ id, label }) => [id, label])).toEqual([
      ['whole', 'Whole'],
      ['half', 'Half'],
      ['quarter', 'Quarter'],
      ['eighth', 'Eighth'],
      ['triplet', 'Triplet'],
      ['sixteenth', '16th'],
    ]);
  });

  test('uses standard SMuFL notation glyphs instead of text abbreviations', () => {
    expect(CLICK_RHYTHMS.map(({ id, glyph }) => [id, glyph])).toEqual([
      ['whole', '\uECA2'],
      ['half', '\uECA3'],
      ['quarter', '\uECA5'],
      ['eighth', '\uECA7'],
      ['triplet', '\uECA7'],
      ['sixteenth', '\uECA9'],
    ]);
    const triplet = CLICK_RHYTHMS.find(({ id }) => id === 'triplet');
    expect(triplet && 'tupletGlyph' in triplet ? triplet.tupletGlyph : undefined).toBe('\uE883');
  });

  test.each([
    ['whole', 2000],
    ['half', 1000],
    ['quarter', 500],
    ['eighth', 250],
    ['triplet', 500 / 3],
    ['sixteenth', 125],
  ] as const)('%s has the correct interval against a 500ms quarter-note beat', (id, expected) => {
    expect(clickIntervalMs(500, id)).toBeCloseTo(expected);
  });

  test.each([
    ['whole', 1, 4],
    ['half', 1, 2],
    ['quarter', 1, 1],
    ['eighth', 2, 1],
    ['triplet', 3, 1],
    ['sixteenth', 4, 1],
  ] as const)('%s maps to visual phases and beat stride', (id, phases, stride) => {
    expect(getBeatPhaseCount(id)).toBe(phases);
    expect(getBeatStride(id)).toBe(stride);
  });
});
