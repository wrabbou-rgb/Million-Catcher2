import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage.js";

export async function registerRoutes(httpServer, app) {
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: "*" },
  });

  io.on("connection", async (socket) => {
    const questions = await storage.getQuestions();

    socket.on("CREATE_ROOM", async (data) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await storage.createGame(data.hostName, data.maxPlayers, code);
      socket.join(code);
      socket.emit("STATE_UPDATE", {
        roomCode: code,
        status: "waiting",
        players: [],
        currentQuestionIndex: 0,
        totalQuestions: questions.length,
        questions,
      });
    });

    socket.on("JOIN_ROOM", async (data) => {
      const game = await storage.getGameByCode(data.roomCode);
      if (!game) return;

      const existingPlayers = await storage.getPlayersInGame(game.id);
      const existing = existingPlayers.find((p) => p.name === data.playerName);

      if (existing) {
        await storage.updatePlayerSocketId(game.id, existing.socketId, socket.id);
      } else {
        await storage.addPlayer(game.id, socket.id, data.playerName, ["from-red-500 to-orange-500","from-orange-500 to-yellow-500","from-yellow-400 to-green-500","from-green-500 to-teal-500","from-blue-500 to-indigo-500","from-indigo-500 to-purple-500","from-purple-500 to-pink-500","from-pink-500 to-red-500","from-cyan-400 to-blue-600","from-yellow-500 to-red-500"][Math.floor(Math.random()*10)]);
      }

      socket.join(data.roomCode);
      const players = await storage.getPlayersInGame(game.id);
      io.to(data.roomCode).emit("STATE_UPDATE", {
        roomCode: game.code,
        status: game.state,
        players,
        currentQuestionIndex: game.currentQuestionIndex,
        currentQuestion:
          game.state === "playing" ? questions[game.currentQuestionIndex] : null,
        totalQuestions: questions.length,
        questions,
      });
    });

    socket.on("START_GAME", async (data) => {
      const game = await storage.getGameByCode(data.roomCode);
      if (!game) return;
      await storage.updateGameState(game.id, "playing");
      const players = await storage.getPlayersInGame(game.id);
      io.to(data.roomCode).emit("STATE_UPDATE", {
        status: "playing",
        players,
        currentQuestionIndex: 0,
        currentQuestion: questions[0],
        totalQuestions: questions.length,
        questions,
      });
    });

    socket.on("UPDATE_BET", async (data) => {
      const game = await storage.getGameByCode(data.roomCode);
      if (!game) return;
      await storage.updatePlayerBet(game.id, socket.id, data.bet);
      socket.emit("BET_SAVED", { ok: true });
    });

    socket.on("CONFIRM_BET", async (data) => {
      const game = await storage.getGameByCode(data.roomCode);
      if (!game) return;
      await storage.confirmPlayerBet(game.id, socket.id);
      const players = await storage.getPlayersInGame(game.id);
      io.to(data.roomCode).emit("PLAYERS_UPDATE", { players });
    });

    socket.on("REVEAL_RESULT", async (data) => {
      const game = await storage.getGameByCode(data.roomCode);
      if (!game) return;
      const players = await storage.getPlayersInGame(game.id);
      const currentQuestion = questions[game.currentQuestionIndex];
      const correctLetter =
        currentQuestion.options.find((o) => o.isCorrect)?.letter ?? "";
      if (!correctLetter) return;

      const updatedPlayers = await Promise.all(
        players
          .filter((p) => p.status === "active")
          .map(async (player) => {
            const bet = player.currentBet || {};
            const totalBet = Object.values(bet).reduce(
              (a, b) => a + Number(b),
              0
            );
            const betOnCorrect = Number(bet[correctLetter] || 0);
            const notBet = player.money - totalBet;
            const newMoney = betOnCorrect + notBet;

            await storage.updatePlayerMoney(game.id, player.socketId, newMoney);
            return {
              ...player,
              money: newMoney,
              status: newMoney <= 0 ? "eliminated" : "active",
            };
          })
      );

      const eliminatedPlayers = players.filter(
        (p) => p.status === "eliminated"
      );
      const allPlayers = [...updatedPlayers, ...eliminatedPlayers];

      io.to(data.roomCode).emit("STATE_UPDATE", {
        players: allPlayers,
        revealedAnswer: correctLetter,
      });
    });

    socket.on("NEXT_QUESTION", async (data) => {
      const game = await storage.getGameByCode(data.roomCode);
      if (!game) return;
      const nextIndex = game.currentQuestionIndex + 1;

      if (nextIndex >= questions.length) {
        await storage.updateGameState(game.id, "finished");
        const players = await storage.getPlayersInGame(game.id);
        io.to(data.roomCode).emit("STATE_UPDATE", {
          status: "finished",
          players,
        });
        return;
      }

      await storage.updateQuestionIndex(game.id, nextIndex);
      const players = await storage.getPlayersInGame(game.id);
      await Promise.all(
        players
          .filter((p) => p.status === "active")
          .map((p) => storage.resetPlayerBet(game.id, p.socketId))
      );
      const freshPlayers = await storage.getPlayersInGame(game.id);

      io.to(data.roomCode).emit("STATE_UPDATE", {
        currentQuestionIndex: nextIndex,
        currentQuestion: questions[nextIndex],
        totalQuestions: questions.length,
        players: freshPlayers,
        revealedAnswer: null,
      });
    });

    socket.on("KICK_PLAYER", async (data) => {
      const game = await storage.getGameByCode(data.roomCode);
      if (!game) return;

      await storage.removePlayer(game.id, data.socketId);
      io.to(data.socketId).emit("KICKED", {
        message: "Has estat expulsat de la sala pel presentador.",
      });

      const kickedSocket = io.sockets.sockets.get(data.socketId);
      if (kickedSocket) kickedSocket.leave(data.roomCode);

      const players = await storage.getPlayersInGame(game.id);
      io.to(data.roomCode).emit("STATE_UPDATE", { players });
    });
  });

  return httpServer;
}
