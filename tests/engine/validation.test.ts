import { describe, test, expect } from 'vitest';
import { validateKeep, isBust, hasScoring, getSelectableIndices } from '../../src/engine/validation.js';

// ============================================================================
// Phase 8: Keep Validation
// ============================================================================

describe('validateKeep', () => {
  test('keeping single 1 is valid', () => {
    const result = validateKeep([1, 2, 3, 4, 6], [1]);
    expect(result.valid).toBe(true);
  });

  test('keeping single 5 is valid', () => {
    const result = validateKeep([5, 2, 3, 4, 6], [5]);
    expect(result.valid).toBe(true);
  });

  test('keeping single 2 is invalid', () => {
    const result = validateKeep([1, 2, 3, 4, 6], [2]);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('keeping three 2s is valid', () => {
    const result = validateKeep([2, 2, 2, 4, 6], [2, 2, 2]);
    expect(result.valid).toBe(true);
  });

  test('keeping two 2s is invalid (partial combo)', () => {
    const result = validateKeep([2, 2, 2, 4, 6], [2, 2]);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('must keep at least one die', () => {
    const result = validateKeep([1, 2, 3, 4, 5], []);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('cannot keep dice not in roll', () => {
    const result = validateKeep([2, 3, 4, 6, 6], [1]);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('cannot keep more dice than rolled', () => {
    const result = validateKeep([1, 1], [1, 1, 1]);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('keeping full house is valid', () => {
    const result = validateKeep([1, 1, 1, 5, 5], [1, 1, 1, 5, 5]);
    expect(result.valid).toBe(true);
  });

  test('keeping four of a kind is valid', () => {
    const result = validateKeep([3, 3, 3, 3, 6], [3, 3, 3, 3]);
    expect(result.valid).toBe(true);
  });

  test('keeping small straight is valid', () => {
    const result = validateKeep([1, 2, 3, 4, 6], [1, 2, 3, 4]);
    expect(result.valid).toBe(true);
  });

  test('keeping large straight is valid', () => {
    const result = validateKeep([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
    expect(result.valid).toBe(true);
  });

  test('keeping triple 1s plus single 5 is valid', () => {
    const result = validateKeep([1, 1, 1, 5, 6], [1, 1, 1, 5]);
    expect(result.valid).toBe(true);
  });

  test('keeping just the 5 from a triple 1s roll is valid', () => {
    const result = validateKeep([1, 1, 1, 5, 6], [5]);
    expect(result.valid).toBe(true);
  });

  test('keeping partial of straight is invalid if no scoring singles', () => {
    // 2, 3, 4 alone don't score
    const result = validateKeep([1, 2, 3, 4, 6], [2, 3, 4]);
    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// Phase 9: Bust Detection
// ============================================================================

describe('isBust', () => {
  test('[2,3,4,6,6] is bust', () => {
    expect(isBust([2, 3, 4, 6, 6])).toBe(true);
  });

  test('[1,2,3,4,6] is not bust (has 1)', () => {
    expect(isBust([1, 2, 3, 4, 6])).toBe(false);
  });

  test('[2,3,4,5,6] is not bust (has 5)', () => {
    expect(isBust([2, 3, 4, 5, 6])).toBe(false);
  });

  test('[2,2,2,3,4] is not bust (triple)', () => {
    expect(isBust([2, 2, 2, 3, 4])).toBe(false);
  });

  test('[1,2,3,4,5] is not bust (straight)', () => {
    expect(isBust([1, 2, 3, 4, 5])).toBe(false);
  });

  test('[2,3,4,6] is bust (4 dice, no scoring)', () => {
    expect(isBust([2, 3, 4, 6])).toBe(true);
  });

  test('[6,6,6] is not bust (triple 6s)', () => {
    expect(isBust([6, 6, 6])).toBe(false);
  });

  test('[2,4,6] is bust', () => {
    expect(isBust([2, 4, 6])).toBe(true);
  });

  test('[4,4,4,4] is not bust (four of a kind)', () => {
    expect(isBust([4, 4, 4, 4])).toBe(false);
  });

  test('empty array is bust', () => {
    expect(isBust([])).toBe(true);
  });
});

describe('hasScoring', () => {
  test('returns true when dice contain scoring combinations', () => {
    expect(hasScoring([1, 2, 3, 4, 6])).toBe(true);
    expect(hasScoring([5])).toBe(true);
    expect(hasScoring([2, 2, 2])).toBe(true);
  });

  test('returns false when no scoring possible', () => {
    expect(hasScoring([2, 3, 4, 6, 6])).toBe(false);
    expect(hasScoring([2, 4, 6])).toBe(false);
  });
});

// ============================================================================
// Dice Selectability
// ============================================================================

describe('getSelectableIndices', () => {
  test('with no selection, only 1s and 5s are selectable for non-combo roll', () => {
    // Roll: [1, 2, 4, 6, 6] - no straights or triples, only 1 scores
    const roll = [1, 2, 4, 6, 6] as const;
    const selectable = getSelectableIndices([...roll], []);
    expect(selectable.has(0)).toBe(true);  // 1 scores
    expect(selectable.has(1)).toBe(false); // 2 alone doesn't score
    expect(selectable.has(2)).toBe(false); // 4 alone doesn't score
    expect(selectable.has(3)).toBe(false); // 6 alone doesn't score
    expect(selectable.has(4)).toBe(false); // 6 alone doesn't score
  });

  test('with no selection, 5s are selectable', () => {
    // Roll without any straights - [2, 4, 5, 6, 6]
    const roll = [2, 4, 5, 6, 6] as const;
    const selectable = getSelectableIndices([...roll], []);
    expect(selectable.has(2)).toBe(true);  // 5 scores
    expect(selectable.has(0)).toBe(false); // 2 alone doesn't score
  });

  test('straight components are selectable', () => {
    // Roll: [1, 2, 3, 4, 6] - has small straight 1-4
    const roll = [1, 2, 3, 4, 6] as const;
    const selectable = getSelectableIndices([...roll], []);
    expect(selectable.has(0)).toBe(true);  // 1 is part of straight (and scores alone)
    expect(selectable.has(1)).toBe(true);  // 2 is part of straight
    expect(selectable.has(2)).toBe(true);  // 3 is part of straight
    expect(selectable.has(3)).toBe(true);  // 4 is part of straight
    expect(selectable.has(4)).toBe(false); // 6 not part of any combo
  });

  test('user example: [2,3,4,5,3] with [2,3,4,5] selected, last 3 is not selectable', () => {
    // Indices: 0=2, 1=3, 2=4, 3=5, 4=3
    // Selection [0,1,2,3] = [2,3,4,5] = small straight 2-5 = 750
    // Adding index 4 (value 3) does not increase score
    const roll = [2, 3, 4, 5, 3] as const;
    const selectable = getSelectableIndices([...roll], [0, 1, 2, 3]);

    // Selected dice are always selectable (to deselect)
    expect(selectable.has(0)).toBe(true);
    expect(selectable.has(1)).toBe(true);
    expect(selectable.has(2)).toBe(true);
    expect(selectable.has(3)).toBe(true);

    // The extra 3 doesn't add to score
    expect(selectable.has(4)).toBe(false);
  });

  test('triple makes all three dice selectable initially', () => {
    // Roll: [2, 2, 2, 4, 6] - all three 2s are part of a scoring combo
    const roll = [2, 2, 2, 4, 6] as const;
    const selectable = getSelectableIndices([...roll], []);

    // All three 2s should be selectable (they form a triple)
    expect(selectable.has(0)).toBe(true);
    expect(selectable.has(1)).toBe(true);
    expect(selectable.has(2)).toBe(true);
    // 4 and 6 are not part of any scoring combo
    expect(selectable.has(3)).toBe(false);
    expect(selectable.has(4)).toBe(false);
  });

  test('with two 2s selected, third 2 becomes selectable to complete triple', () => {
    const roll = [2, 2, 2, 4, 6] as const;
    // With indices [0, 1] selected (two 2s), can we add third 2?
    const selectable = getSelectableIndices([...roll], [0, 1]);

    // Selected dice are selectable (to deselect)
    expect(selectable.has(0)).toBe(true);
    expect(selectable.has(1)).toBe(true);

    // Third 2 completes triple: score goes from 0 to 200
    expect(selectable.has(2)).toBe(true);

    // Non-scoring dice still not selectable
    expect(selectable.has(3)).toBe(false);
    expect(selectable.has(4)).toBe(false);
  });

  test('adding die to complete full house', () => {
    // Roll: [1, 1, 1, 5, 5] - full house
    const roll = [1, 1, 1, 5, 5] as const;

    // With [0,1,2,3] selected (three 1s + one 5 = 1050)
    // Adding second 5 completes full house (2500)
    const selectable = getSelectableIndices([...roll], [0, 1, 2, 3]);
    expect(selectable.has(4)).toBe(true); // Second 5 increases score
  });

  test('with 1 selected, can add another 1', () => {
    const roll = [1, 1, 3, 4, 6] as const;
    const selectable = getSelectableIndices([...roll], [0]); // First 1 selected

    expect(selectable.has(0)).toBe(true);  // Already selected
    expect(selectable.has(1)).toBe(true);  // Second 1 adds 100 points
    expect(selectable.has(2)).toBe(false); // 3 doesn't score
  });

  test('bust roll has no selectable dice', () => {
    const roll = [2, 3, 4, 6, 6] as const;
    const selectable = getSelectableIndices([...roll], []);
    expect(selectable.size).toBe(0);
  });

  test('can build large straight 2-3-4-5-6 incrementally', () => {
    // Roll: [3, 6, 2, 4, 5] = large straight 2-3-4-5-6
    const roll = [3, 6, 2, 4, 5] as const;

    // Initially all should be selectable (all part of straight)
    const selectable0 = getSelectableIndices([...roll], []);
    expect(selectable0.size).toBe(5);

    // After selecting index 0 (value 3), all others should still be selectable
    const selectable1 = getSelectableIndices([...roll], [0]);
    expect(selectable1.has(0)).toBe(true);  // Can deselect
    expect(selectable1.has(1)).toBe(true);  // 6
    expect(selectable1.has(2)).toBe(true);  // 2
    expect(selectable1.has(3)).toBe(true);  // 4
    expect(selectable1.has(4)).toBe(true);  // 5

    // After selecting 3 and 6, can still select the rest
    const selectable2 = getSelectableIndices([...roll], [0, 1]);
    expect(selectable2.has(2)).toBe(true);  // 2
    expect(selectable2.has(3)).toBe(true);  // 4
    expect(selectable2.has(4)).toBe(true);  // 5
  });

  test('can build large straight 1-2-3-4-5 incrementally', () => {
    const roll = [5, 3, 1, 4, 2] as const;

    // After selecting one die, all others should still be selectable
    const selectable = getSelectableIndices([...roll], [1]); // selected 3
    expect(selectable.has(0)).toBe(true);  // 5
    expect(selectable.has(2)).toBe(true);  // 1
    expect(selectable.has(3)).toBe(true);  // 4
    expect(selectable.has(4)).toBe(true);  // 2
  });

  test('can build small straight incrementally', () => {
    const roll = [1, 2, 3, 4, 6] as const;

    // After selecting 2 (not a scoring single), can still build the straight
    const selectable = getSelectableIndices([...roll], [1]); // selected 2
    expect(selectable.has(0)).toBe(true);  // 1 (part of straight)
    expect(selectable.has(2)).toBe(true);  // 3 (part of straight)
    expect(selectable.has(3)).toBe(true);  // 4 (part of straight)
    expect(selectable.has(4)).toBe(false); // 6 (not part of straight)
  });
});
