/**
 * Translations for Greedy Dice Game
 *
 * Supported languages:
 * - en: English
 * - pt: Portuguese (Brazilian)
 */

export type Language = 'en' | 'pt';

export const translations = {
  en: {
    // App header
    appTitle: 'GREEDY',
    newGame: 'New Game',
    hints: 'Hints',
    hintsOn: 'Hints On',

    // Start screen
    tagline: 'A dice game of risk and reward',
    quickStart: 'Quick Start (vs AI)',
    orCustomize: 'or customize',
    numberOfPlayers: 'Number of Players',
    startGame: 'Start Game',
    gameInfo: 'First to {target} wins. Score {threshold}+ in one turn to get on the board.',
    player: 'Player',
    human: 'Human',
    ai: 'AI',
    aiPersonality: 'AI Personality',
    enterName: 'Enter name',

    // AI strategies
    strategySafe: 'Safe',
    strategySafeDesc: 'Banks early, avoids risk',
    strategyBalanced: 'Balanced',
    strategyBalancedDesc: 'Smart risk/reward decisions',
    strategyRisky: 'Risky',
    strategyRiskyDesc: 'Pushes for big scores',
    strategyWild: 'Wild',
    strategyWildDesc: 'Completely unpredictable',

    // Game board
    turnOf: "{name}'s Turn",
    thinking: 'Thinking...',
    rolling: 'Rolling...',
    turnEnded: 'Turn ended',
    rollToStart: 'Roll the dice to start your turn',
    luckyBreakLow: '🍀 Lucky break! High risk - only {count} die left',
    luckyBreakMed: '🍀 Lucky break! Risky roll for bonus points',
    luckyBreakHigh: '🍀 Lucky break! Roll to claim bonus points',
    tapToKeep: 'Tap the scoring dice you want to keep',
    rollOrBank: 'Roll again or bank your points',
    needThreshold: 'Keep rolling - need {threshold}+ to get on board',
    keepRollingForEntry: 'Keep rolling to reach entry threshold',
    riskOrBank: 'Roll again to risk it, or bank to keep your points',
    showRules: 'Show game rules',

    // Dice roll
    readyToRoll: 'Ready to Roll',
    tapDiceToKeep: 'Tap dice to keep',
    selectScoringDice: 'Select scoring dice',
    pressToRoll: 'Press the button to roll',
    aiThinking: 'AI is thinking...',
    keeping: 'Keeping',
    aiKeeping: 'AI Keeping',
    tapDiceAbove: 'Tap dice above to keep them',
    selectedDiceHere: 'Selected dice appear here',
    waitingForAI: 'Waiting for AI...',
    rollDice: 'Roll Dice',
    keepAndRoll: 'Keep & Roll {count}',
    hotDice: 'Hot Dice!',
    roll: 'Roll {count}',

    // Score display
    turnScore: 'Turn Score',
    includesCarryover: '(Includes {points} from carryover)',
    entryProgress: 'Entry Progress',
    needMoreToBoard: 'Need {points} more to get on the board',
    readyToBoard: 'Ready to get on the board!',
    totalScore: 'Total Score',
    diceRemaining: 'dice remaining',

    // Player list
    players: 'Players',
    finalRound: 'Final Round',
    notOnBoard: 'Not on board',
    leader: 'Leader',

    // Action buttons
    bankPoints: 'Bank Points',
    bank: 'Bank',
    declineStartFresh: 'Decline & Start Fresh',

    // Bust
    bust: 'BUST!',

    // Selection feedback
    selected: 'Selected:',
    turnTotal: 'Turn total:',

    // Game over
    gameOver: 'Game Over!',
    winner: 'Winner',
    finalStandings: 'Final Standings',
    playAgain: 'Play Again',
    points: 'points',

    // Help panel
    howToPlay: 'How to Play Greedy',
    close: 'Close',
    gotIt: 'Got it!',

    // Help sections
    helpGoal: 'Goal',
    helpGoalText: 'Be the first player to reach {target} points!',
    helpHowToPlay: 'How to Play',
    helpStep1: 'Roll all 5 dice to start your turn',
    helpStep2: 'Keep any dice that score points (see scoring below)',
    helpStep3: 'Choose: Roll the remaining dice for more points, or bank what you have',
    helpStep4: 'If you roll and get NO scoring dice, you BUST and lose all points from this turn!',
    helpGettingOnBoard: 'Getting On Board',
    helpGettingOnBoardText: 'Your first scoring turn must be worth at least {threshold} points to "get on the board." Until then, any points you bank don\'t count!',
    helpScoring: 'Scoring',
    helpSingle1: 'Single 1',
    helpSingle5: 'Single 5',
    helpThree1s: 'Three 1s',
    helpThree2s: 'Three 2s',
    helpThree3s: 'Three 3s',
    helpThree4s: 'Three 4s',
    helpThree5s: 'Three 5s',
    helpThree6s: 'Three 6s',
    helpFourOfKind: 'Four of a kind',
    helpFiveOfKind: 'Five of a kind',
    helpSmallStraight: 'Small straight (4 in a row)',
    helpLargeStraight: 'Large straight (5 in a row)',
    helpDoubleTriple: '2× triple',
    helpQuadrupleTriple: '4× triple',
    helpHotDice: 'Hot Dice!',
    helpHotDiceText: 'If you keep all 5 dice, you get 5 fresh dice to roll again! Your points carry over - this is how you build huge scores.',
    helpLuckyBreak: '🍀 Lucky Break',
    helpLuckyBreakText: 'When a player banks with dice remaining, the next player gets a lucky break - a chance to claim bonus points by rolling the leftover dice. But beware: if you bust, you get nothing! Fewer dice means higher risk.',
    helpTips: 'Tips for New Players',
    helpTip1: 'Single 1s and 5s always score - they\'re your safety net',
    helpTip2: 'The more dice you roll, the better your chance of scoring',
    helpTip3: 'Bank often when you\'re close to {threshold} to get on the board',
    helpTip4: 'Rolling with just 1 or 2 dice is very risky!',
    helpTip5: 'Watch the other players\' scores in the final round',

    // Turn history
    recentTurns: 'Recent Turns',
    currentTurn: 'Current Turn',

    // Language
    language: 'Language',
    english: 'English',
    portuguese: 'Português',
  },

  pt: {
    // App header
    appTitle: 'GREEDY',
    newGame: 'Novo Jogo',
    hints: 'Dicas',
    hintsOn: 'Dicas Ativas',

    // Start screen
    tagline: 'Um jogo de dados de risco e recompensa',
    quickStart: 'Início Rápido (vs IA)',
    orCustomize: 'ou personalize',
    numberOfPlayers: 'Número de Jogadores',
    startGame: 'Iniciar Jogo',
    gameInfo: 'Primeiro a {target} vence. Marque {threshold}+ em um turno para entrar no jogo.',
    player: 'Jogador',
    human: 'Humano',
    ai: 'IA',
    aiPersonality: 'Personalidade da IA',
    enterName: 'Digite o nome',

    // AI strategies
    strategySafe: 'Seguro',
    strategySafeDesc: 'Guarda cedo, evita risco',
    strategyBalanced: 'Equilibrado',
    strategyBalancedDesc: 'Decisões inteligentes de risco',
    strategyRisky: 'Arriscado',
    strategyRiskyDesc: 'Busca pontuações altas',
    strategyWild: 'Louco',
    strategyWildDesc: 'Completamente imprevisível',

    // Game board
    turnOf: 'Vez de {name}',
    thinking: 'Pensando...',
    rolling: 'Rolando...',
    turnEnded: 'Turno encerrado',
    rollToStart: 'Role os dados para começar seu turno',
    luckyBreakLow: '🍀 Sorte grande! Alto risco - só {count} dado restante',
    luckyBreakMed: '🍀 Sorte grande! Rolagem arriscada por pontos bônus',
    luckyBreakHigh: '🍀 Sorte grande! Role para ganhar pontos bônus',
    tapToKeep: 'Toque nos dados que pontuam para guardá-los',
    rollOrBank: 'Role novamente ou guarde seus pontos',
    needThreshold: 'Continue rolando - precisa de {threshold}+ para entrar no jogo',
    keepRollingForEntry: 'Continue rolando para atingir o limite de entrada',
    riskOrBank: 'Role novamente para arriscar, ou guarde seus pontos',
    showRules: 'Mostrar regras do jogo',

    // Dice roll
    readyToRoll: 'Pronto para Rolar',
    tapDiceToKeep: 'Toque para guardar',
    selectScoringDice: 'Selecione dados que pontuam',
    pressToRoll: 'Pressione o botão para rolar',
    aiThinking: 'IA está pensando...',
    keeping: 'Guardando',
    aiKeeping: 'IA Guardando',
    tapDiceAbove: 'Toque nos dados acima para guardá-los',
    selectedDiceHere: 'Dados selecionados aparecem aqui',
    waitingForAI: 'Aguardando IA...',
    rollDice: 'Rolar Dados',
    keepAndRoll: 'Guardar e Rolar {count}',
    hotDice: 'Dados Quentes!',
    roll: 'Rolar {count}',

    // Score display
    turnScore: 'Pontos do Turno',
    includesCarryover: '(Inclui {points} do turno anterior)',
    entryProgress: 'Progresso de Entrada',
    needMoreToBoard: 'Precisa de mais {points} para entrar no jogo',
    readyToBoard: 'Pronto para entrar no jogo!',
    totalScore: 'Pontuação Total',
    diceRemaining: 'dados restantes',

    // Player list
    players: 'Jogadores',
    finalRound: 'Rodada Final',
    notOnBoard: 'Fora do jogo',
    leader: 'Líder',

    // Action buttons
    bankPoints: 'Guardar Pontos',
    bank: 'Guardar',
    declineStartFresh: 'Recusar e Começar do Zero',

    // Bust
    bust: 'ESTOUROU!',

    // Selection feedback
    selected: 'Selecionado:',
    turnTotal: 'Total do turno:',

    // Game over
    gameOver: 'Fim de Jogo!',
    winner: 'Vencedor',
    finalStandings: 'Classificação Final',
    playAgain: 'Jogar Novamente',
    points: 'pontos',

    // Help panel
    howToPlay: 'Como Jogar Greedy',
    close: 'Fechar',
    gotIt: 'Entendi!',

    // Help sections
    helpGoal: 'Objetivo',
    helpGoalText: 'Seja o primeiro jogador a alcançar {target} pontos!',
    helpHowToPlay: 'Como Jogar',
    helpStep1: 'Role todos os 5 dados para começar seu turno',
    helpStep2: 'Guarde os dados que pontuam (veja pontuação abaixo)',
    helpStep3: 'Escolha: Role os dados restantes para mais pontos, ou guarde o que tem',
    helpStep4: 'Se você rolar e não conseguir NENHUM dado que pontua, você ESTOURA e perde todos os pontos deste turno!',
    helpGettingOnBoard: 'Entrando no Jogo',
    helpGettingOnBoardText: 'Seu primeiro turno com pontuação deve valer pelo menos {threshold} pontos para "entrar no jogo". Até lá, qualquer ponto que você guardar não conta!',
    helpScoring: 'Pontuação',
    helpSingle1: 'Um 1',
    helpSingle5: 'Um 5',
    helpThree1s: 'Três 1s',
    helpThree2s: 'Três 2s',
    helpThree3s: 'Três 3s',
    helpThree4s: 'Três 4s',
    helpThree5s: 'Três 5s',
    helpThree6s: 'Três 6s',
    helpFourOfKind: 'Quadra',
    helpFiveOfKind: 'Quintilha',
    helpSmallStraight: 'Sequência pequena (4 em fila)',
    helpLargeStraight: 'Sequência grande (5 em fila)',
    helpDoubleTriple: '2× trinca',
    helpQuadrupleTriple: '4× trinca',
    helpHotDice: 'Dados Quentes!',
    helpHotDiceText: 'Se você guardar todos os 5 dados, você ganha 5 dados novos para rolar! Seus pontos continuam - é assim que você constrói pontuações enormes.',
    helpLuckyBreak: '🍀 Sorte Grande',
    helpLuckyBreakText: 'Quando um jogador guarda pontos com dados restantes, o próximo jogador tem uma sorte grande - uma chance de ganhar pontos bônus rolando os dados restantes. Mas cuidado: se estourar, não ganha nada! Menos dados significa mais risco.',
    helpTips: 'Dicas para Novos Jogadores',
    helpTip1: '1s e 5 sozinhos sempre pontuam - são sua rede de segurança',
    helpTip2: 'Quanto mais dados você rolar, maior a chance de pontuar',
    helpTip3: 'Guarde frequentemente quando estiver perto de {threshold} para entrar no jogo',
    helpTip4: 'Rolar com apenas 1 ou 2 dados é muito arriscado!',
    helpTip5: 'Observe a pontuação dos outros jogadores na rodada final',

    // Turn history
    recentTurns: 'Turnos Recentes',
    currentTurn: 'Turno Atual',

    // Language
    language: 'Idioma',
    english: 'English',
    portuguese: 'Português',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
