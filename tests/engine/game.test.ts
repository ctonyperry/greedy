import { describe, test, expect } from 'vitest';
import {
  createGameState,
  gameReducer,
  getCurrentPlayer,
  getWinner,
  PlayerConfig,
} from '../../src/engine/game.js';
import { TurnPhase } from '../../src/types/index.js';

// Helper to create player configs from names
function players(...names: string[]): PlayerConfig[] {
  return names.map(name => ({ name, isAI: false }));
}

// ============================================================================
// Phase 13: Game State Management
// ============================================================================

describe('createGameState', () => {
  test('creates game with specified players', () => {
    const state = createGameState(players('Alice', 'Bob', 'Charlie'));
    expect(state.players).toHaveLength(3);
    expect(state.players[0].name).toBe('Alice');
    expect(state.players[1].name).toBe('Bob');
    expect(state.players[2].name).toBe('Charlie');
  });

  test('first player starts with a turn', () => {
    const state = createGameState(players('Alice', 'Bob'));
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.turn.phase).toBe(TurnPhase.ROLLING);
  });

  test('all players start with zero score and not on board', () => {
    const state = createGameState(players('Alice', 'Bob'));
    for (const player of state.players) {
      expect(player.score).toBe(0);
      expect(player.isOnBoard).toBe(false);
    }
  });

  test('game starts with no carryover', () => {
    const state = createGameState(players('Alice', 'Bob'));
    expect(state.carryoverPot).toBeNull();
  });
});

describe('gameReducer - basic flow', () => {
  test('players take turns in order', () => {
    let state = createGameState(players('Alice', 'Bob', 'Charlie'));

    // Alice's turn - roll and bust
    state = gameReducer(state, { type: 'ROLL', dice: [2, 3, 4, 6, 6] });
    expect(state.turn.phase).toBe(TurnPhase.ENDED);

    // End turn advances to Bob
    state = gameReducer(state, { type: 'END_TURN' });
    expect(state.currentPlayerIndex).toBe(1);
    expect(getCurrentPlayer(state).name).toBe('Bob');

    // Bob's turn - roll and bust
    state = gameReducer(state, { type: 'ROLL', dice: [2, 3, 4, 6, 6] });
    state = gameReducer(state, { type: 'END_TURN' });
    expect(state.currentPlayerIndex).toBe(2);
    expect(getCurrentPlayer(state).name).toBe('Charlie');

    // Charlie's turn - roll and bust
    state = gameReducer(state, { type: 'ROLL', dice: [2, 3, 4, 6, 6] });
    state = gameReducer(state, { type: 'END_TURN' });

    // Wraps back to Alice
    expect(state.currentPlayerIndex).toBe(0);
    expect(getCurrentPlayer(state).name).toBe('Alice');
  });

  test('banking adds score to player', () => {
    let state = createGameState(players('Alice', 'Bob'));

    // Alice rolls and keeps enough to get on board
    state = gameReducer(state, { type: 'ROLL', dice: [1, 1, 1, 5, 5] });
    state = gameReducer(state, { type: 'KEEP', dice: [1, 1, 1, 5, 5] }); // Triple 1s (1000) + two 5s (100) = 1100
    state = gameReducer(state, { type: 'BANK' });
    state = gameReducer(state, { type: 'END_TURN' });

    expect(state.players[0].score).toBe(1100);
    expect(state.players[0].isOnBoard).toBe(true);
  });

  test('player enters game when scoring >= 600', () => {
    let state = createGameState(players('Alice', 'Bob'));

    // Alice gets exactly 600
    state = gameReducer(state, { type: 'ROLL', dice: [1, 1, 1, 2, 3] }); // triple 1s available
    state = gameReducer(state, { type: 'KEEP', dice: [1, 1, 1] }); // 1000 points

    expect(state.players[0].isOnBoard).toBe(false); // Not on board until banked
    state = gameReducer(state, { type: 'BANK' });
    state = gameReducer(state, { type: 'END_TURN' });

    expect(state.players[0].isOnBoard).toBe(true);
    expect(state.players[0].score).toBe(1000);
  });
});

describe('gameReducer - carryover', () => {
  test('stopping with dice remaining creates carryover', () => {
    let state = createGameState(players('Alice', 'Bob'));

    // Alice banks with dice remaining (needs to be on board first)
    state = gameReducer(state, { type: 'ROLL', dice: [1, 1, 1, 5, 2] });
    state = gameReducer(state, { type: 'KEEP', dice: [1, 1, 1, 5] }); // 1050, 1 die left
    state = gameReducer(state, { type: 'BANK' });
    state = gameReducer(state, { type: 'END_TURN' });

    expect(state.carryoverPot).not.toBeNull();
    expect(state.carryoverPot!.points).toBe(1050);
    expect(state.carryoverPot!.diceCount).toBe(1);
  });

  test('next player starts with steal required', () => {
    let state = createGameState(players('Alice', 'Bob'));

    // Alice banks with dice remaining
    state = gameReducer(state, { type: 'ROLL', dice: [1, 1, 1, 5, 2] });
    state = gameReducer(state, { type: 'KEEP', dice: [1, 1, 1, 5] });
    state = gameReducer(state, { type: 'BANK' });
    state = gameReducer(state, { type: 'END_TURN' });

    // Bob must attempt steal
    expect(state.turn.phase).toBe(TurnPhase.STEAL_REQUIRED);
    expect(state.turn.diceRemaining).toBe(1);
  });

  test('carryover disappears on failed steal', () => {
    let state = createGameState(players('Alice', 'Bob'));

    // Setup carryover
    state = gameReducer(state, { type: 'ROLL', dice: [1, 1, 1, 5, 2] });
    state = gameReducer(state, { type: 'KEEP', dice: [1, 1, 1, 5] });
    state = gameReducer(state, { type: 'BANK' });
    state = gameReducer(state, { type: 'END_TURN' });

    // Bob fails steal
    state = gameReducer(state, { type: 'ROLL', dice: [3] }); // No 1 or 5
    state = gameReducer(state, { type: 'END_TURN' });

    // Carryover is gone
    expect(state.carryoverPot).toBeNull();
  });

  test('player can decline carryover', () => {
    let state = createGameState(players('Alice', 'Bob'));

    // Setup carryover
    state = gameReducer(state, { type: 'ROLL', dice: [1, 1, 1, 5, 2] });
    state = gameReducer(state, { type: 'KEEP', dice: [1, 1, 1, 5] });
    state = gameReducer(state, { type: 'BANK' });
    state = gameReducer(state, { type: 'END_TURN' });

    // Bob is in STEAL_REQUIRED phase
    expect(state.turn.phase).toBe(TurnPhase.STEAL_REQUIRED);
    expect(state.carryoverPot).not.toBeNull();

    // Bob declines the carryover
    state = gameReducer(state, { type: 'DECLINE_CARRYOVER' });

    // Carryover is cleared and Bob starts fresh turn
    expect(state.carryoverPot).toBeNull();
    expect(state.turn.phase).toBe(TurnPhase.ROLLING);
    expect(state.turn.diceRemaining).toBe(5);
    expect(state.turn.hasCarryover).toBe(false);
    expect(state.currentPlayerIndex).toBe(1); // Still Bob's turn
  });
});

describe('gameReducer - endgame', () => {
  test('reaching target score triggers final round', () => {
    let state = createGameState(players('Alice', 'Bob'));

    // Give Alice enough points to reach target
    state.players[0].score = 9000;
    state.players[0].isOnBoard = true;

    // Alice scores 1500 more (large straight)
    state = gameReducer(state, { type: 'ROLL', dice: [1, 2, 3, 4, 5] });
    state = gameReducer(state, { type: 'KEEP', dice: [1, 2, 3, 4, 5] });
    state = gameReducer(state, { type: 'BANK' });
    state = gameReducer(state, { type: 'END_TURN' });

    expect(state.isFinalRound).toBe(true);
    expect(state.finalRoundTriggerIndex).toBe(0);
    expect(state.players[0].score).toBe(10500);
  });

  test('all other players get one final turn', () => {
    let state = createGameState(players('Alice', 'Bob', 'Charlie'));

    // Setup: Alice triggers final round
    state.players[0].score = 9500;
    state.players[0].isOnBoard = true;
    state.players[1].isOnBoard = true;
    state.players[2].isOnBoard = true;

    state = gameReducer(state, { type: 'ROLL', dice: [1, 1, 1, 2, 3] });
    state = gameReducer(state, { type: 'KEEP', dice: [1, 1, 1] }); // 1000
    state = gameReducer(state, { type: 'BANK' });
    state = gameReducer(state, { type: 'END_TURN' });

    expect(state.isFinalRound).toBe(true);
    expect(state.isGameOver).toBe(false);

    // Bob's final turn
    state = gameReducer(state, { type: 'ROLL', dice: [2, 3, 4, 6, 6] }); // Bust
    state = gameReducer(state, { type: 'END_TURN' });
    expect(state.isGameOver).toBe(false);

    // Charlie's final turn
    state = gameReducer(state, { type: 'ROLL', dice: [2, 3, 4, 6, 6] }); // Bust
    state = gameReducer(state, { type: 'END_TURN' });

    // Game over - back to Alice who triggered
    expect(state.isGameOver).toBe(true);
  });

  test('highest score wins', () => {
    let state = createGameState(players('Alice', 'Bob'));

    // Setup scores - Alice holds score to beat
    state.players[0].score = 10500;
    state.players[0].isOnBoard = true;
    state.players[1].score = 9800;
    state.players[1].isOnBoard = true;
    state.isFinalRound = true;
    state.finalRoundTriggerIndex = 0;
    state.scoreToBeat = 10500;
    state.scoreToBeatPlayerIndex = 0;
    state.currentPlayerIndex = 1;

    // Bob's final turn - bust, doesn't beat Alice
    state = gameReducer(state, { type: 'ROLL', dice: [2, 3, 4, 6, 6] });
    state = gameReducer(state, { type: 'END_TURN' });

    expect(state.isGameOver).toBe(true);
    expect(getWinner(state)?.name).toBe('Alice');
  });

  test('other player can win in final round', () => {
    let state = createGameState(players('Alice', 'Bob'));

    // Setup: Alice has triggered final round with 10000
    state.players[0].score = 10000;
    state.players[0].isOnBoard = true;
    state.players[1].score = 9500;
    state.players[1].isOnBoard = true;
    state.isFinalRound = true;
    state.finalRoundTriggerIndex = 0;
    state.scoreToBeat = 10000;
    state.scoreToBeatPlayerIndex = 0;
    state.currentPlayerIndex = 1;
    state.carryoverPot = null;
    state.turn = {
      phase: TurnPhase.ROLLING,
      turnScore: 0,
      diceRemaining: 5,
      currentRoll: null,
      keptDice: [],
      hasCarryover: false,
      carryoverClaimed: false,
      carryoverPoints: 0,
    };

    // Bob's final turn - scores big to beat Alice
    state = gameReducer(state, { type: 'ROLL', dice: [1, 1, 1, 1, 1] });
    state = gameReducer(state, { type: 'KEEP', dice: [1, 1, 1, 1, 1] }); // Five 1s = 4000
    state = gameReducer(state, { type: 'BANK' });
    state = gameReducer(state, { type: 'END_TURN' });

    // Bob now has 13500 and holds the score to beat
    expect(state.players[1].score).toBe(13500);
    expect(state.scoreToBeat).toBe(13500);
    expect(state.scoreToBeatPlayerIndex).toBe(1);
    // highScoreBeatenThisRound resets to false when someone becomes new score holder

    // Now it's Alice's turn again (new round to beat Bob's score)
    expect(state.isGameOver).toBe(false);
    expect(state.currentPlayerIndex).toBe(0);

    // Alice can't beat Bob's 13500, busts
    state = gameReducer(state, { type: 'ROLL', dice: [2, 3, 4, 6, 6] });
    state = gameReducer(state, { type: 'END_TURN' });

    // Now game ends - no one beat Bob's score in this round
    expect(state.isGameOver).toBe(true);
    expect(getWinner(state)?.name).toBe('Bob');
  });
});

describe('getCurrentPlayer', () => {
  test('returns the current player', () => {
    const state = createGameState(players('Alice', 'Bob', 'Charlie'));
    expect(getCurrentPlayer(state).name).toBe('Alice');
  });
});

describe('getWinner', () => {
  test('returns null if game not over', () => {
    const state = createGameState(players('Alice', 'Bob'));
    expect(getWinner(state)).toBeNull();
  });

  test('returns player with highest score', () => {
    let state = createGameState(players('Alice', 'Bob'));
    state.isGameOver = true;
    state.players[0].score = 8000;
    state.players[1].score = 10500;

    expect(getWinner(state)?.name).toBe('Bob');
  });
});
