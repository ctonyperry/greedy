# Greedy Dice Game - TDD Implementation Plan

## Progress Tracker

| Phase | Description | Status | Tests | Notes |
|-------|-------------|--------|-------|-------|
| 1 | Foundation & Types | DONE | 5 | Project setup, types, test runner |
| 2 | Scoring - Singles | DONE | 8 | 1s=100, 5s=50 |
| 3 | Scoring - Triples | DONE | 8 | Three of a kind |
| 4 | Scoring - 4/5 of Kind | DONE | 5 | 1500/2000 points |
| 5 | Scoring - Straights | DONE | 8 | Small=750, Large=1500 |
| 6 | Scoring - Full House | DONE | 6 | 2500 points |
| 7 | Composite Scoring | DONE | 10 | Optimal score calculation |
| 8 | Keep Validation | DONE | 16 | Legal dice keeps |
| 9 | Bust Detection | DONE | 11 | No scoring dice |
| 10 | Turn State Machine | DONE | 11 | Phases and transitions |
| 11 | Carryover Pot | DONE | 4 | Steal mechanics |
| 12 | Entry Threshold | DONE | 5 | 600-point rule |
| 13 | Game State | DONE | 17 | Multi-player flow |
| 14 | AI Strategies | DONE | 16 | Decision making |
| 15 | UI Components | DONE | - | React + Framer Motion |

**Total Tests: 124 passing**

**Implementation Complete!**

---

## Phase 1: Foundation & Types
**Checkpoint: Core types defined, project scaffolded, test runner working**

### Tasks
- [ ] Initialize project (Vite + React + TypeScript)
- [ ] Configure Vitest for testing
- [ ] Define core types in `types/index.ts`

### Types to Define
- `DieValue` (1-6)
- `DiceFace[]` for rolls
- `ScoringResult`
- `TurnPhase` enum (NORMAL, STEAL_REQUIRED)
- `GameState`, `PlayerState`, `TurnState`
- `CarryoverPot`

---

## Phase 2: Scoring Engine - Singles
**Checkpoint: Single dice scoring (1s and 5s) works correctly**

### Tests
- [ ] single 1 scores 100
- [ ] single 5 scores 50
- [ ] multiple 1s score 100 each
- [ ] multiple 5s score 50 each
- [ ] 2, 3, 4, 6 score nothing as singles
- [ ] [1, 5, 2] scores 150

---

## Phase 3: Scoring Engine - Three of a Kind
**Checkpoint: Triple combinations score correctly**

### Tests
- [ ] three 1s = 1000
- [ ] three 2s = 200
- [ ] three 3s = 300
- [ ] three 4s = 400
- [ ] three 5s = 500
- [ ] three 6s = 600
- [ ] only exactly 3 counts (not 4)

---

## Phase 4: Scoring Engine - Four/Five of a Kind
**Checkpoint: 4-of-a-kind (1500) and 5-of-a-kind (2000) work**

### Tests
- [ ] four of any kind = 1500
- [ ] five of any kind = 2000
- [ ] four 1s = 1500 (not 1000 + 100)
- [ ] four 5s = 1500 (not 500 + 50)

---

## Phase 5: Scoring Engine - Straights
**Checkpoint: Small and large straights score correctly**

### Tests
- [ ] small straight 1-2-3-4 = 750
- [ ] small straight 2-3-4-5 = 750
- [ ] large straight 1-2-3-4-5 = 1500
- [ ] 1-2-3-4 + extra 1 = 750 + 100 = 850
- [ ] 1-2-3-4 + extra 5 = 750 + 50 = 800
- [ ] large straight uses all dice, no extra singles

---

## Phase 6: Scoring Engine - Full House
**Checkpoint: Full house (3+2) scores 2500**

### Tests
- [ ] 1-1-1-5-5 = 2500
- [ ] 2-2-2-3-3 = 2500
- [ ] full house takes precedence over singles
- [ ] 3-3-3-3-2 is NOT full house (4+1)

---

## Phase 7: Composite Scoring
**Checkpoint: `scoreSelection()` finds optimal score for any dice set**

### Tests
- [ ] returns highest possible score
- [ ] [1,1,1,5,5] returns 2500 (full house)
- [ ] [1,1,1,2,5] returns 1000 + 50 = 1050
- [ ] [5,5,5,5,1] returns 1500 (four of kind)
- [ ] identifies which dice were used
- [ ] [2,3,4,6,6] returns 0 (no scoring dice)

---

## Phase 8: Keep Validation
**Checkpoint: Validate legal dice keeps**

### Tests
- [ ] keeping single 1 is valid
- [ ] keeping single 5 is valid
- [ ] keeping single 2 is invalid
- [ ] keeping three 2s is valid
- [ ] keeping two 2s is invalid (partial combo)
- [ ] must keep at least one die
- [ ] cannot keep dice not in roll

---

## Phase 9: Bust Detection
**Checkpoint: Detect when a roll has no scoring dice**

### Tests
- [ ] [2,3,4,6,6] is bust
- [ ] [1,2,3,4,6] is not bust
- [ ] [2,3,4,5,6] is not bust
- [ ] [2,2,2,3,4] is not bust (triple)
- [ ] [1,2,3,4,5] is not bust (straight)

---

## Phase 10: Turn State Machine
**Checkpoint: Turn phases and transitions work correctly**

### Tests
- [ ] normal turn starts in ROLLING phase
- [ ] steal turn starts in STEAL_REQUIRED phase
- [ ] bust ends turn immediately
- [ ] keeping dice transitions to DECIDING phase
- [ ] hot dice refreshes to 5 dice
- [ ] banking ends turn with score
- [ ] cannot bank immediately after steal roll

---

## Phase 11: Carryover Pot System
**Checkpoint: Carryover creation and steal attempts work**

### Tests
- [ ] stopping with dice creates carryover
- [ ] pot value equals banked turn score
- [ ] pot includes remaining dice count
- [ ] successful steal adds pot to turn
- [ ] failed steal loses pot permanently
- [ ] pot does not count toward entry threshold

---

## Phase 12: Entry Threshold
**Checkpoint: 600-point entry rule enforced**

### Tests
- [ ] player not on board cannot bank < 600
- [ ] player can bank >= 600 to enter
- [ ] carryover pot does not count toward 600
- [ ] once on board, any score can be banked

---

## Phase 13: Game State Management
**Checkpoint: Full game flow with multiple players**

### Tests
- [ ] players take turns in order
- [ ] reaching 10000 triggers final round
- [ ] all players get final turn
- [ ] highest score wins
- [ ] carryover passes to next player

---

## Phase 14: AI Strategies
**Checkpoint: AI can make decisions using engine APIs**

### Tests
- [ ] conservative AI stops at 300+
- [ ] aggressive AI pushes to hot dice
- [ ] AI correctly evaluates steal risk
- [ ] AI uses same engine APIs as human

---

## Phase 15: UI Components
**Checkpoint: React components render game state**

### Tasks
- [ ] Dice display with selection
- [ ] Score display
- [ ] Player list
- [ ] Action buttons (Roll, Bank)
- [ ] Gesture support via @use-gesture/react

---

## TDD Workflow Per Phase

1. **Write failing tests** for the phase
2. **Run tests** - confirm they fail
3. **Implement minimum code** to pass tests
4. **Refactor** if needed (tests still pass)
5. **Commit** with descriptive message
6. **Move to next phase**

---

## Constants Reference

```
SINGLE_1 = 100
SINGLE_5 = 50
TRIPLE_1 = 1000
TRIPLE_2 = 200
TRIPLE_3 = 300
TRIPLE_4 = 400
TRIPLE_5 = 500
TRIPLE_6 = 600
FOUR_OF_KIND = 1500
FIVE_OF_KIND = 2000
SMALL_STRAIGHT = 750
LARGE_STRAIGHT = 1500
FULL_HOUSE = 2500
ENTRY_THRESHOLD = 600
TARGET_SCORE = 10000
DICE_COUNT = 5
```
