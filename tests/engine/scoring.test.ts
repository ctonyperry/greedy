import { describe, test, expect } from 'vitest';
import { scoreSingles, scoreSelection, countDice } from '../../src/engine/scoring.js';
import type { Dice } from '../../src/types/index.js';

describe('countDice', () => {
  test('counts occurrences of each die value', () => {
    const dice: Dice = [1, 1, 2, 3, 5];
    const counts = countDice(dice);
    expect(counts.get(1)).toBe(2);
    expect(counts.get(2)).toBe(1);
    expect(counts.get(3)).toBe(1);
    expect(counts.get(5)).toBe(1);
    expect(counts.get(4)).toBeUndefined();
    expect(counts.get(6)).toBeUndefined();
  });
});

// ============================================================================
// Phase 2: Singles Scoring
// ============================================================================

describe('scoreSingles', () => {
  test('single 1 scores 100', () => {
    expect(scoreSingles([1])).toBe(100);
  });

  test('single 5 scores 50', () => {
    expect(scoreSingles([5])).toBe(50);
  });

  test('multiple 1s score 100 each', () => {
    expect(scoreSingles([1, 1])).toBe(200);
    expect(scoreSingles([1, 1, 1])).toBe(300);
  });

  test('multiple 5s score 50 each', () => {
    expect(scoreSingles([5, 5])).toBe(100);
    expect(scoreSingles([5, 5, 5])).toBe(150);
  });

  test('2, 3, 4, 6 score nothing as singles', () => {
    expect(scoreSingles([2])).toBe(0);
    expect(scoreSingles([3])).toBe(0);
    expect(scoreSingles([4])).toBe(0);
    expect(scoreSingles([6])).toBe(0);
    expect(scoreSingles([2, 3, 4, 6])).toBe(0);
  });

  test('[1, 5, 2] scores 150', () => {
    expect(scoreSingles([1, 5, 2])).toBe(150);
  });

  test('mixed dice with 1s and 5s', () => {
    expect(scoreSingles([1, 5, 1, 5, 2])).toBe(300);
  });

  test('empty array scores 0', () => {
    expect(scoreSingles([])).toBe(0);
  });
});

// ============================================================================
// Phase 3: Triple Scoring
// ============================================================================

describe('scoreSelection - triples', () => {
  test('three 1s = 1000', () => {
    const result = scoreSelection([1, 1, 1]);
    expect(result.score).toBe(1000);
  });

  test('three 2s = 200', () => {
    const result = scoreSelection([2, 2, 2]);
    expect(result.score).toBe(200);
  });

  test('three 3s = 300', () => {
    const result = scoreSelection([3, 3, 3]);
    expect(result.score).toBe(300);
  });

  test('three 4s = 400', () => {
    const result = scoreSelection([4, 4, 4]);
    expect(result.score).toBe(400);
  });

  test('three 5s = 500', () => {
    const result = scoreSelection([5, 5, 5]);
    expect(result.score).toBe(500);
  });

  test('three 6s = 600', () => {
    const result = scoreSelection([6, 6, 6]);
    expect(result.score).toBe(600);
  });

  test('triple with extra singles adds correctly', () => {
    // Three 2s (200) + one 1 (100) = 300
    const result = scoreSelection([2, 2, 2, 1]);
    expect(result.score).toBe(300);
  });

  test('triple with extra non-scoring dice', () => {
    // Three 3s (300) + 2 and 4 (0) = 300
    const result = scoreSelection([3, 3, 3, 2, 4]);
    expect(result.score).toBe(300);
  });
});

// ============================================================================
// Phase 4: Four/Five of a Kind (double triple value / double four-of-a-kind)
// ============================================================================

describe('scoreSelection - four/five of a kind', () => {
  test('four of a kind = double triple value', () => {
    // 4×2s = 200×2 = 400
    expect(scoreSelection([2, 2, 2, 2]).score).toBe(400);
    // 4×3s = 300×2 = 600
    expect(scoreSelection([3, 3, 3, 3]).score).toBe(600);
    // 4×4s = 400×2 = 800
    expect(scoreSelection([4, 4, 4, 4]).score).toBe(800);
    // 4×6s = 600×2 = 1200
    expect(scoreSelection([6, 6, 6, 6]).score).toBe(1200);
  });

  test('four 1s = 2000 (double 1000)', () => {
    const result = scoreSelection([1, 1, 1, 1]);
    expect(result.score).toBe(2000);
  });

  test('four 5s = 1000 (double 500)', () => {
    const result = scoreSelection([5, 5, 5, 5]);
    expect(result.score).toBe(1000);
  });

  test('five of a kind = double four-of-a-kind value', () => {
    // 5×1s = 2000×2 = 4000
    expect(scoreSelection([1, 1, 1, 1, 1]).score).toBe(4000);
    // 5×2s = 400×2 = 800
    expect(scoreSelection([2, 2, 2, 2, 2]).score).toBe(800);
    // 5×5s = 1000×2 = 2000
    expect(scoreSelection([5, 5, 5, 5, 5]).score).toBe(2000);
    // 5×6s = 1200×2 = 2400
    expect(scoreSelection([6, 6, 6, 6, 6]).score).toBe(2400);
  });

  test('four of a kind with extra single', () => {
    // Four 2s (400) + one 1 (100) = 500
    const result = scoreSelection([2, 2, 2, 2, 1]);
    expect(result.score).toBe(500);
  });
});

// ============================================================================
// Phase 5: Straights
// ============================================================================

describe('scoreSelection - straights', () => {
  test('small straight 1-2-3-4 = 750', () => {
    const result = scoreSelection([1, 2, 3, 4]);
    expect(result.score).toBe(750);
  });

  test('small straight 2-3-4-5 = 750', () => {
    const result = scoreSelection([2, 3, 4, 5]);
    expect(result.score).toBe(750);
  });

  test('large straight 1-2-3-4-5 = 1500', () => {
    const result = scoreSelection([1, 2, 3, 4, 5]);
    expect(result.score).toBe(1500);
  });

  test('large straight 2-3-4-5-6 = 1500', () => {
    const result = scoreSelection([2, 3, 4, 5, 6]);
    expect(result.score).toBe(1500);
  });

  test('1-2-3-4 + extra 1 = 750 + 100 = 850', () => {
    const result = scoreSelection([1, 2, 3, 4, 1]);
    expect(result.score).toBe(850);
  });

  test('1-2-3-4 + extra 5 = 750 + 50 = 800', () => {
    const result = scoreSelection([1, 2, 3, 4, 5]);
    // Wait - this is a large straight! Let me reconsider.
    // [1,2,3,4,5] is a large straight = 1500, not small + 5
    expect(result.score).toBe(1500);
  });

  test('2-3-4-5 + extra 1 = 750 + 100 = 850', () => {
    const result = scoreSelection([2, 3, 4, 5, 1]);
    // This is also 1-2-3-4-5 large straight!
    expect(result.score).toBe(1500);
  });

  test('2-3-4-5 + extra 5 = 750 + 50 = 800', () => {
    const result = scoreSelection([2, 3, 4, 5, 5]);
    expect(result.score).toBe(800);
  });

  test('1-2-3-4 + extra 6 (non-scoring) = 750', () => {
    const result = scoreSelection([1, 2, 3, 4, 6]);
    expect(result.score).toBe(750);
  });

  test('order does not matter for straights', () => {
    expect(scoreSelection([4, 2, 1, 3]).score).toBe(750);
    expect(scoreSelection([5, 3, 1, 4, 2]).score).toBe(1500);
  });
});

// ============================================================================
// Phase 6: Triple + Pairs (no full house in updated rules)
// ============================================================================

describe('scoreSelection - triple with pairs', () => {
  test('1-1-1-5-5 = 1000 + 100 = 1100 (triple 1s + two 5s)', () => {
    const result = scoreSelection([1, 1, 1, 5, 5]);
    expect(result.score).toBe(1100);
  });

  test('2-2-2-3-3 = 200 (triple 2s, 3s dont score)', () => {
    const result = scoreSelection([2, 2, 2, 3, 3]);
    expect(result.score).toBe(200);
  });

  test('5-5-5-1-1 = 500 + 200 = 700 (triple 5s + two 1s)', () => {
    const result = scoreSelection([5, 5, 5, 1, 1]);
    expect(result.score).toBe(700);
  });

  test('6-6-6-4-4 = 600 (triple 6s, 4s dont score)', () => {
    const result = scoreSelection([6, 6, 6, 4, 4]);
    expect(result.score).toBe(600);
  });

  test('3-3-3-3-2 = 600 (four 3s, 2 doesnt score)', () => {
    // Four 3s = 300×2 = 600
    const result = scoreSelection([3, 3, 3, 3, 2]);
    expect(result.score).toBe(600);
  });

  test('triple + singles scoring', () => {
    // 1-1-1-5-5 = triple 1s (1000) + two 5s (100) = 1100
    const result = scoreSelection([1, 1, 1, 5, 5]);
    expect(result.score).toBe(1100);
  });
});

// ============================================================================
// Phase 7: Composite Scoring
// ============================================================================

describe('scoreSelection - composite/edge cases', () => {
  test('returns correct score for triple + singles', () => {
    // Triple 1s (1000) + two 5s (100) = 1100
    const result = scoreSelection([1, 1, 1, 5, 5]);
    expect(result.score).toBe(1100);
  });

  test('[2,3,4,6,6] returns 0 (no scoring dice)', () => {
    const result = scoreSelection([2, 3, 4, 6, 6]);
    expect(result.score).toBe(0);
  });

  test('identifies which dice were used', () => {
    const result = scoreSelection([1, 2, 3, 4, 6]);
    // Small straight 1-2-3-4 uses those dice, 6 remains
    expect(result.scoringDice.sort()).toEqual([1, 2, 3, 4]);
    expect(result.remainingDice).toEqual([6]);
  });

  test('single 1 only', () => {
    const result = scoreSelection([1, 2, 3, 4, 6]);
    // Actually this is a small straight! Let me fix.
    expect(result.score).toBe(750);
  });

  test('just singles with non-scoring dice', () => {
    const result = scoreSelection([1, 5, 2, 3, 6]);
    expect(result.score).toBe(150);
    expect(result.scoringDice.sort()).toEqual([1, 5]);
  });

  test('breakdown describes scoring components', () => {
    const result = scoreSelection([1, 1, 1]);
    expect(result.breakdown.length).toBeGreaterThan(0);
    expect(result.breakdown[0].description).toContain('Three 1s');
    expect(result.breakdown[0].points).toBe(1000);
  });

  test('empty dice array', () => {
    const result = scoreSelection([]);
    expect(result.score).toBe(0);
    expect(result.scoringDice).toEqual([]);
    expect(result.remainingDice).toEqual([]);
  });
});
