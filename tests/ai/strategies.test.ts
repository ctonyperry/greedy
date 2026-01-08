import { describe, test, expect } from 'vitest';
import {
  conservativeStrategy,
  aggressiveStrategy,
  balancedStrategy,
  chaosStrategy,
  makeAIDecision,
} from '../../src/ai/strategies.js';
import { createTurnState, turnReducer } from '../../src/engine/turn.js';
import { TurnPhase } from '../../src/types/index.js';
import type { TurnState } from '../../src/types/index.js';

// Helper to create a turn state at the DECIDING phase
function createDecidingState(
  turnScore: number,
  diceRemaining: number,
  options?: { isOnBoard?: boolean; hasCarryover?: boolean }
): { turnState: TurnState; isOnBoard: boolean } {
  const turnState: TurnState = {
    phase: TurnPhase.DECIDING,
    turnScore,
    diceRemaining,
    currentRoll: null,
    keptDice: [],
    hasCarryover: options?.hasCarryover ?? false,
    carryoverClaimed: false,
    carryoverPoints: 0,
  };
  return { turnState, isOnBoard: options?.isOnBoard ?? true };
}

// ============================================================================
// Phase 14: AI Strategies
// ============================================================================

describe('conservativeStrategy', () => {
  test('stops at 300+ points', () => {
    const { turnState, isOnBoard } = createDecidingState(300, 3);
    const decision = conservativeStrategy(turnState, isOnBoard);
    expect(decision.action).toBe('BANK');
  });

  test('continues rolling with less than 300', () => {
    const { turnState, isOnBoard } = createDecidingState(250, 3);
    const decision = conservativeStrategy(turnState, isOnBoard);
    expect(decision.action).toBe('ROLL');
  });

  test('requires 600+ before banking when not on board', () => {
    const { turnState, isOnBoard } = createDecidingState(500, 2, { isOnBoard: false });
    const decision = conservativeStrategy(turnState, isOnBoard);
    expect(decision.action).toBe('ROLL'); // Must continue to reach 600
  });
});

describe('aggressiveStrategy', () => {
  test('pushes for hot dice with few dice remaining', () => {
    const { turnState, isOnBoard } = createDecidingState(1000, 2);
    const decision = aggressiveStrategy(turnState, isOnBoard);
    expect(decision.action).toBe('ROLL');
  });

  test('continues rolling until score is very high', () => {
    const { turnState, isOnBoard } = createDecidingState(2000, 3);
    const decision = aggressiveStrategy(turnState, isOnBoard);
    expect(decision.action).toBe('ROLL');
  });

  test('banks when score is extremely high', () => {
    const { turnState, isOnBoard } = createDecidingState(4000, 3);
    const decision = aggressiveStrategy(turnState, isOnBoard);
    expect(decision.action).toBe('BANK');
  });
});

describe('balancedStrategy', () => {
  test('banks at moderate score with few dice', () => {
    const { turnState, isOnBoard } = createDecidingState(800, 2);
    const decision = balancedStrategy(turnState, isOnBoard);
    expect(decision.action).toBe('BANK');
  });

  test('continues with moderate score and many dice', () => {
    const { turnState, isOnBoard } = createDecidingState(500, 4);
    const decision = balancedStrategy(turnState, isOnBoard);
    expect(decision.action).toBe('ROLL');
  });

  test('banks with high score', () => {
    const { turnState, isOnBoard } = createDecidingState(1500, 3);
    const decision = balancedStrategy(turnState, isOnBoard);
    expect(decision.action).toBe('BANK');
  });
});

describe('chaosStrategy', () => {
  test('returns valid decision', () => {
    const { turnState, isOnBoard } = createDecidingState(500, 3);
    const decision = chaosStrategy(turnState, isOnBoard);
    expect(['ROLL', 'BANK']).toContain(decision.action);
  });

  test('respects entry threshold when not on board', () => {
    // Run multiple times to check consistency
    for (let i = 0; i < 10; i++) {
      const { turnState, isOnBoard } = createDecidingState(400, 3, { isOnBoard: false });
      const decision = chaosStrategy(turnState, isOnBoard);
      // Cannot bank below 600 when not on board
      expect(decision.action).toBe('ROLL');
    }
  });
});

describe('makeAIDecision - keep selection', () => {
  test('AI chooses optimal dice to keep', () => {
    let turnState = createTurnState();
    turnState = turnReducer(turnState, { type: 'ROLL', dice: [1, 1, 1, 5, 6] });

    const decision = makeAIDecision(turnState, true, balancedStrategy);
    expect(decision.action).toBe('KEEP');
    expect(decision.dice).toBeDefined();

    // Should keep at least the scoring dice
    const keptDice = decision.dice!;
    expect(keptDice.length).toBeGreaterThan(0);
  });

  test('AI keeps full house when available', () => {
    let turnState = createTurnState();
    turnState = turnReducer(turnState, { type: 'ROLL', dice: [1, 1, 1, 5, 5] });

    const decision = makeAIDecision(turnState, true, balancedStrategy);
    expect(decision.action).toBe('KEEP');
    // Should keep all 5 for full house (2500 points)
    expect(decision.dice).toHaveLength(5);
  });

  test('AI uses same engine APIs as human', () => {
    let turnState = createTurnState();
    turnState = turnReducer(turnState, { type: 'ROLL', dice: [1, 5, 2, 3, 6] });

    const decision = makeAIDecision(turnState, true, conservativeStrategy);

    // The decision should be valid - either KEEP or ROLL/BANK after keeping
    expect(['KEEP', 'ROLL', 'BANK']).toContain(decision.action);

    if (decision.action === 'KEEP' && decision.dice) {
      // Kept dice should be valid (only 1s and 5s in this case)
      for (const die of decision.dice) {
        expect([1, 5]).toContain(die);
      }
    }
  });
});

describe('makeAIDecision - steal attempt', () => {
  test('AI evaluates steal risk', () => {
    // Create a steal scenario
    const turnState: TurnState = {
      phase: TurnPhase.STEAL_REQUIRED,
      turnScore: 0,
      diceRemaining: 2,
      currentRoll: [1, 3], // Has a 1, so steal succeeds
      keptDice: [],
      hasCarryover: true,
      carryoverClaimed: false,
      carryoverPoints: 1000,
    };

    // AI should keep the 1
    const decision = makeAIDecision(turnState, true, balancedStrategy);
    expect(decision.action).toBe('KEEP');
    expect(decision.dice).toContain(1);
  });
});

describe('AI personality differences', () => {
  test('aggressive takes more risks than conservative', () => {
    const { turnState, isOnBoard } = createDecidingState(700, 3);

    const conservativeDecision = conservativeStrategy(turnState, isOnBoard);
    const aggressiveDecision = aggressiveStrategy(turnState, isOnBoard);

    // Conservative should bank, aggressive should roll
    expect(conservativeDecision.action).toBe('BANK');
    expect(aggressiveDecision.action).toBe('ROLL');
  });
});
