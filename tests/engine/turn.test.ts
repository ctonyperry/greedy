import { describe, test, expect } from 'vitest';
import {
  createTurnState,
  turnReducer,
  TurnAction,
  canBank,
} from '../../src/engine/turn.js';
import { TurnPhase } from '../../src/types/index.js';
import type { CarryoverPot } from '../../src/types/index.js';
import { DICE_COUNT } from '../../src/engine/constants.js';

// ============================================================================
// Phase 10: Turn State Machine
// ============================================================================

describe('createTurnState', () => {
  test('normal turn starts in ROLLING phase', () => {
    const state = createTurnState();
    expect(state.phase).toBe(TurnPhase.ROLLING);
    expect(state.diceRemaining).toBe(DICE_COUNT);
    expect(state.turnScore).toBe(0);
  });

  test('steal turn starts in STEAL_REQUIRED phase', () => {
    const carryover: CarryoverPot = { points: 500, diceCount: 2 };
    const state = createTurnState(carryover);
    expect(state.phase).toBe(TurnPhase.STEAL_REQUIRED);
    expect(state.diceRemaining).toBe(2);
    expect(state.hasCarryover).toBe(true);
    expect(state.carryoverPoints).toBe(500);
  });
});

describe('turnReducer - rolling', () => {
  test('roll action provides dice results', () => {
    const state = createTurnState();
    const action: TurnAction = {
      type: 'ROLL',
      dice: [1, 2, 3, 4, 5],
    };
    const newState = turnReducer(state, action);
    expect(newState.currentRoll).toEqual([1, 2, 3, 4, 5]);
    expect(newState.phase).toBe(TurnPhase.KEEPING);
  });

  test('bust ends turn immediately with zero score', () => {
    const state = createTurnState();
    const action: TurnAction = {
      type: 'ROLL',
      dice: [2, 3, 4, 6, 6], // No 1 or 5, no combos
    };
    const newState = turnReducer(state, action);
    expect(newState.phase).toBe(TurnPhase.ENDED);
    expect(newState.turnScore).toBe(0);
  });
});

describe('turnReducer - keeping dice', () => {
  test('keeping dice transitions to DECIDING phase', () => {
    let state = createTurnState();
    state = turnReducer(state, { type: 'ROLL', dice: [1, 2, 3, 4, 6] });

    const keepAction: TurnAction = {
      type: 'KEEP',
      dice: [1],
    };
    const newState = turnReducer(state, keepAction);
    expect(newState.phase).toBe(TurnPhase.DECIDING);
    expect(newState.turnScore).toBe(100);
    expect(newState.diceRemaining).toBe(4);
  });

  test('keeping multiple scoring dice adds to turn score', () => {
    let state = createTurnState();
    state = turnReducer(state, { type: 'ROLL', dice: [1, 1, 5, 2, 3] });

    const keepAction: TurnAction = {
      type: 'KEEP',
      dice: [1, 1, 5],
    };
    const newState = turnReducer(state, keepAction);
    expect(newState.turnScore).toBe(250); // 100 + 100 + 50
    expect(newState.diceRemaining).toBe(2);
  });

  test('hot dice: scoring all 5 dice refreshes to 5', () => {
    let state = createTurnState();
    state = turnReducer(state, { type: 'ROLL', dice: [1, 1, 1, 5, 5] });

    const keepAction: TurnAction = {
      type: 'KEEP',
      dice: [1, 1, 1, 5, 5], // Triple 1s (1000) + two 5s (100) = 1100
    };
    const newState = turnReducer(state, keepAction);
    expect(newState.turnScore).toBe(1100);
    expect(newState.diceRemaining).toBe(5); // Hot dice!
    expect(newState.phase).toBe(TurnPhase.DECIDING);
  });
});

describe('turnReducer - banking', () => {
  test('banking ends turn with accumulated score', () => {
    let state = createTurnState();
    state = turnReducer(state, { type: 'ROLL', dice: [1, 2, 3, 4, 6] });
    state = turnReducer(state, { type: 'KEEP', dice: [1] });

    const bankAction: TurnAction = { type: 'BANK' };
    const newState = turnReducer(state, bankAction);
    expect(newState.phase).toBe(TurnPhase.ENDED);
    expect(newState.turnScore).toBe(100);
  });

  test('continuing to roll after keeping', () => {
    let state = createTurnState();
    state = turnReducer(state, { type: 'ROLL', dice: [1, 2, 3, 4, 6] });
    state = turnReducer(state, { type: 'KEEP', dice: [1] });

    const rollAction: TurnAction = { type: 'ROLL', dice: [5, 2, 3, 4] };
    const newState = turnReducer(state, rollAction);
    expect(newState.phase).toBe(TurnPhase.KEEPING);
    expect(newState.currentRoll).toEqual([5, 2, 3, 4]);
    expect(newState.turnScore).toBe(100); // Previous kept score retained
  });
});

// ============================================================================
// Phase 11: Carryover Pot System
// ============================================================================

describe('turnReducer - carryover/steal', () => {
  test('successful steal roll claims pot', () => {
    const carryover: CarryoverPot = { points: 1500, diceCount: 2 };
    let state = createTurnState(carryover);

    // Roll with at least one 1 or 5
    const rollAction: TurnAction = { type: 'ROLL', dice: [1, 2] };
    const newState = turnReducer(state, rollAction);

    expect(newState.phase).toBe(TurnPhase.KEEPING);
    expect(newState.carryoverClaimed).toBe(false); // Not claimed until dice kept
  });

  test('failed steal roll ends turn with zero', () => {
    const carryover: CarryoverPot = { points: 1500, diceCount: 2 };
    let state = createTurnState(carryover);

    // Roll with no 1 or 5 - bust
    const rollAction: TurnAction = { type: 'ROLL', dice: [2, 3] };
    const newState = turnReducer(state, rollAction);

    expect(newState.phase).toBe(TurnPhase.ENDED);
    expect(newState.turnScore).toBe(0);
    expect(newState.carryoverClaimed).toBe(false);
  });

  test('keeping dice after steal claims the pot', () => {
    const carryover: CarryoverPot = { points: 1500, diceCount: 2 };
    let state = createTurnState(carryover);

    state = turnReducer(state, { type: 'ROLL', dice: [1, 2] });
    state = turnReducer(state, { type: 'KEEP', dice: [1] });

    expect(state.carryoverClaimed).toBe(true);
    expect(state.turnScore).toBe(1600); // 1500 carryover + 100 for the 1
    expect(state.carryoverPoints).toBe(1500);
  });

  test('hot dice after carryover steal gives fresh dice', () => {
    const carryover: CarryoverPot = { points: 1500, diceCount: 2 };
    let state = createTurnState(carryover);

    state = turnReducer(state, { type: 'ROLL', dice: [1, 5] });
    state = turnReducer(state, { type: 'KEEP', dice: [1, 5] }); // Keep all = hot dice

    // Hot dice resets to 5 fresh dice
    expect(state.diceRemaining).toBe(5);
    // Score should include carryover (1500) + 1 (100) + 5 (50) = 1650
    expect(state.turnScore).toBe(1650);
    expect(state.carryoverClaimed).toBe(true);
  });
});

describe('canBank', () => {
  test('cannot bank if not on board and score < 600', () => {
    let state = createTurnState();
    state = turnReducer(state, { type: 'ROLL', dice: [1, 2, 3, 4, 6] });
    state = turnReducer(state, { type: 'KEEP', dice: [1] }); // 100 points

    expect(canBank(state, false)).toBe(false);
  });

  test('can bank if score >= 600 when not on board', () => {
    let state = createTurnState();
    state = turnReducer(state, { type: 'ROLL', dice: [1, 1, 1, 5, 5] });
    state = turnReducer(state, { type: 'KEEP', dice: [1, 1, 1, 5, 5] }); // 2500 full house

    expect(canBank(state, false)).toBe(true);
  });

  test('can bank any score when already on board', () => {
    let state = createTurnState();
    state = turnReducer(state, { type: 'ROLL', dice: [1, 2, 3, 4, 6] });
    state = turnReducer(state, { type: 'KEEP', dice: [1] }); // 100 points

    expect(canBank(state, true)).toBe(true);
  });

  test('carryover points do not count toward 600 threshold', () => {
    const carryover: CarryoverPot = { points: 550, diceCount: 2 };
    let state = createTurnState(carryover);

    state = turnReducer(state, { type: 'ROLL', dice: [1, 2] });
    state = turnReducer(state, { type: 'KEEP', dice: [1] }); // +100

    // Total turn score is 650 (550 carryover + 100 own)
    // But own score is only 100, not enough for entry
    expect(state.turnScore).toBe(650);
    expect(canBank(state, false)).toBe(false);
  });

  test('own score >= 600 with carryover allows entry', () => {
    const carryover: CarryoverPot = { points: 200, diceCount: 1 };
    let state = createTurnState(carryover);

    state = turnReducer(state, { type: 'ROLL', dice: [1] });
    state = turnReducer(state, { type: 'KEEP', dice: [1] });
    // Now we have hot dice with score 300 (200 + 100)

    // Need to build to 600 own points
    state = { ...state, diceRemaining: 5, phase: TurnPhase.ROLLING };
    state = turnReducer(state, { type: 'ROLL', dice: [5, 5, 5, 5, 5] }); // five 5s = 2000
    state = turnReducer(state, { type: 'KEEP', dice: [5, 5, 5, 5, 5] });

    // Now own score is 2100 (100 + 2000), carryover is 200
    expect(canBank(state, false)).toBe(true);
  });
});

// ============================================================================
// Additional Edge Cases
// ============================================================================

describe('turnReducer - edge cases', () => {
  test('multiple rolls accumulate score', () => {
    let state = createTurnState();

    // First roll - keep a 1
    state = turnReducer(state, { type: 'ROLL', dice: [1, 2, 3, 4, 6] });
    state = turnReducer(state, { type: 'KEEP', dice: [1] });
    expect(state.turnScore).toBe(100);

    // Second roll - keep a 5
    state = turnReducer(state, { type: 'ROLL', dice: [5, 2, 3, 6] });
    state = turnReducer(state, { type: 'KEEP', dice: [5] });
    expect(state.turnScore).toBe(150);

    // Third roll - keep triple 2s
    state = turnReducer(state, { type: 'ROLL', dice: [2, 2, 2] });
    state = turnReducer(state, { type: 'KEEP', dice: [2, 2, 2] });
    expect(state.turnScore).toBe(350);
  });

  test('hot dice resets dice count', () => {
    let state = createTurnState();

    // Roll and keep all 5 (large straight)
    state = turnReducer(state, { type: 'ROLL', dice: [1, 2, 3, 4, 5] });
    state = turnReducer(state, { type: 'KEEP', dice: [1, 2, 3, 4, 5] });

    expect(state.diceRemaining).toBe(5);
    expect(state.turnScore).toBe(1500);
  });
});
