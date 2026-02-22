// In-memory storage — no database required!
// Data lives in RAM while the server is running.

let nextGameId = 1;
let nextPlayerId = 1;

/** @type {Map<number, object>} */
const gamesMap = new Map();

/** @type {Map<number, object>} */
const playersMap = new Map();

export class MemoryStorage {
  async createGame(hostName, maxPlayers, code) {
    const game = {
      id: nextGameId++,
      hostName,
      maxPlayers,
      code,
      state: "waiting",
      currentQuestionIndex: 0,
      createdAt: new Date(),
    };
    gamesMap.set(game.id, game);
    return game;
  }

  async getGameByCode(code) {
    for (const game of gamesMap.values()) {
      if (game.code === code) return game;
    }
    return undefined;
  }

  async updateGameState(gameId, state) {
    const game = gamesMap.get(gameId);
    if (game) game.state = state;
  }

  async updateGameQuestion(gameId, index) {
    const game = gamesMap.get(gameId);
    if (game) game.currentQuestionIndex = index;
  }

  async updateQuestionIndex(gameId, index) {
    const game = gamesMap.get(gameId);
    if (game) game.currentQuestionIndex = index;
  }

  async addPlayer(gameId, socketId, name) {
    const player = {
      id: nextPlayerId++,
      gameId,
      socketId,
      name,
      money: 1000000,
      status: "active",
      questionIndex: 0,
      lastAnswer: null,
      currentBet: {},
      hasConfirmed: false,
    };
    playersMap.set(player.id, player);
    return player;
  }

  async getPlayerBySocketId(socketId) {
    for (const player of playersMap.values()) {
      if (player.socketId === socketId) return player;
    }
    return undefined;
  }

  async updatePlayer(playerId, updates) {
    const player = playersMap.get(playerId);
    if (!player) return undefined;
    if (updates.money !== undefined) player.money = updates.money;
    if (updates.status !== undefined) player.status = updates.status;
    if (updates.lastAnswer !== undefined) player.lastAnswer = updates.lastAnswer;
    return player;
  }

  async getPlayersInGame(gameId) {
    const result = [];
    for (const player of playersMap.values()) {
      if (player.gameId === gameId) result.push(player);
    }
    return result;
  }

  async getQuestions() {
    return QUESTIONS_DATA;
  }

  async updatePlayerBet(gameId, socketId, bet) {
    for (const player of playersMap.values()) {
      if (player.gameId === gameId && player.socketId === socketId) {
        player.currentBet = bet;
        break;
      }
    }
  }

  async confirmPlayerBet(gameId, socketId) {
    for (const player of playersMap.values()) {
      if (player.gameId === gameId && player.socketId === socketId) {
        player.hasConfirmed = true;
        break;
      }
    }
  }

  async updatePlayerMoney(gameId, socketId, money) {
    for (const player of playersMap.values()) {
      if (player.gameId === gameId && player.socketId === socketId) {
        player.money = money;
        player.status = money <= 0 ? "eliminated" : "active";
        break;
      }
    }
  }

  async resetPlayerBet(gameId, socketId) {
    for (const player of playersMap.values()) {
      if (player.gameId === gameId && player.socketId === socketId) {
        player.currentBet = {};
        player.hasConfirmed = false;
        break;
      }
    }
  }

  async removePlayer(gameId, socketId) {
    for (const [id, player] of playersMap.entries()) {
      if (player.gameId === gameId && player.socketId === socketId) {
        playersMap.delete(id);
        break;
      }
    }
  }

  async updatePlayerSocketId(gameId, oldSocketId, newSocketId) {
    for (const player of playersMap.values()) {
      if (player.gameId === gameId && player.socketId === oldSocketId) {
        player.socketId = newSocketId;
        break;
      }
    }
  }
}

export const storage = new MemoryStorage();

const QUESTIONS_DATA = [
  {
    id: 1,
    order: 1,
    type: "normal",
    maxOptionsToBet: 3,
    text: "Quin any va inventar Nikolaus August Otto el primer motor de quatre temps amb compressió?",
    options: [
      { letter: "A", id: "A", text: "1876", isCorrect: true },
      { letter: "B", id: "B", text: "1878", isCorrect: false },
      { letter: "C", id: "C", text: "1880", isCorrect: false },
      { letter: "D", id: "D", text: "1885", isCorrect: false },
    ],
  },
  {
    id: 2,
    order: 2,
    type: "normal",
    maxOptionsToBet: 3,
    text: "Quin és el component que transforma el moviment rectilini del pistó en moviment rotatiu?",
    options: [
      { letter: "A", id: "A", text: "La biela", isCorrect: false },
      { letter: "B", id: "B", text: "El cigonyal", isCorrect: true },
      { letter: "C", id: "C", text: "El volant d'inèrcia", isCorrect: false },
      { letter: "D", id: "D", text: "L'arbre de lleves", isCorrect: false },
    ],
  },
  {
    id: 3,
    order: 3,
    type: "normal",
    maxOptionsToBet: 3,
    text: "En quin ordre es produeixen les fases del motor de 4 temps?",
    options: [
      { letter: "A", id: "A", text: "Compressió, admissió, explosió, escapament", isCorrect: false },
      { letter: "B", id: "B", text: "Admissió, compressió, explosió, escapament", isCorrect: true },
      { letter: "C", id: "C", text: "Explosió, compressió, admissió, escapament", isCorrect: false },
      { letter: "D", id: "D", text: "Admissió, explosió, compressió, escapament", isCorrect: false },
    ],
  },
  {
    id: 4,
    order: 4,
    type: "reduced",
    maxOptionsToBet: 2,
    text: "Quina temperatura pot superar la combustió dins del cilindre?",
    options: [
      { letter: "A", id: "A", text: "500 °C", isCorrect: false },
      { letter: "B", id: "B", text: "1.000 °C", isCorrect: false },
      { letter: "C", id: "C", text: "2.000 °C", isCorrect: true },
    ],
  },
  {
    id: 5,
    order: 5,
    type: "reduced",
    maxOptionsToBet: 2,
    text: "Què és el càrter en un motor Otto?",
    options: [
      { letter: "A", id: "A", text: "La peça que tanca els cilindres per dalt", isCorrect: false },
      { letter: "B", id: "B", text: "El dipòsit d'oli a la part inferior del motor", isCorrect: true },
      { letter: "C", id: "C", text: "L'element que uneix el pistó amb el cigonyal", isCorrect: false },
    ],
  },
  {
    id: 6,
    order: 6,
    type: "reduced",
    maxOptionsToBet: 2,
    text: "Segons el Segon Principi de la Termodinàmica aplicat al motor:",
    options: [
      { letter: "A", id: "A", text: "Tota la calor es converteix en treball útil", isCorrect: false },
      { letter: "B", id: "B", text: "Part de l'energia s'ha de cedir a un focus fred", isCorrect: true },
      { letter: "C", id: "C", text: "No es pot generar energia mecànica des de calor", isCorrect: false },
    ],
  },
  {
    id: 7,
    order: 7,
    type: "reduced",
    maxOptionsToBet: 2,
    text: "Quina diferència principal té el motor de 2 temps respecte al de 4 temps?",
    options: [
      { letter: "A", id: "A", text: "Té vàlvules més complexes", isCorrect: false },
      { letter: "B", id: "B", text: "Completa el cicle en una volta de cigonyal", isCorrect: true },
      { letter: "C", id: "C", text: "És menys contaminant", isCorrect: false },
    ],
  },
  {
    id: 8,
    order: 8,
    type: "final",
    maxOptionsToBet: 1,
    text: "Quina és la temperatura de treball òptima d'un motor Otto?",
    options: [
      { letter: "A", id: "A", text: "90 °C", isCorrect: true },
      { letter: "B", id: "B", text: "150 °C", isCorrect: false },
    ],
  },
];
