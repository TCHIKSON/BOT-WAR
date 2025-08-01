const {
  incrementBombCount,
  getBombCount,
} = require("../middleware/middleware");

const MOVES = ["UP", "DOWN", "LEFT", "RIGHT", "STAY"];
const ACTIONS = ["BOMB", "COLLECT", "NONE"];
const MAX_BOMBS = 3;

const logiqueActions = (gameState = {}) => {
  const currentBombs = getBombCount();

  // Si on a atteint la limite de bombes, on ne peut plus en poser
 if (currentBombs >= MAX_BOMBS) {
        return Math.random() < 0.7 ? "COLLECT" : "NONE";
    }

  // Logique simple : 50% collect, 30% bomb, 20% none

    const rand = Math.random();
    if (rand < 0.5) return "COLLECT";
    if (rand < 0.9) return "BOMB";
    return "NONE";
  
};

const logiqueMoves = (gameState = {}) => {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
};

const getAction = (requestedAction, requestedMove, gameState = {}) => {
  let action = requestedAction;
  let move = requestedMove;

  // Si aucune action n'est spécifiée, utiliser la logique automatique
  if (!action || action === "") {
    action = logiqueActions(gameState);
  }

  // Si aucun mouvement n'est spécifié, utiliser la logique automatique
  if (!move || move === "") {
    move = logiqueMoves(gameState);
  }

  // Vérifier si l'action bomb est valide
  if (action === "BOMB") {
    const currentBombs = getBombCount();
    if (currentBombs >= MAX_BOMBS) {
      console.log("Limite de bombes atteinte, action changée vers COLLECT");
      action = "COLLECT";
    } else {
      incrementBombCount();
      console.log(`Bombe posée. Total: ${getBombCount()}/${MAX_BOMBS}`);
    }
  }

  // Valider les entrées
  if (!ACTIONS.includes(action)) {
    console.error("Action invalide:", action);
    action = "COLLECT";
  }

  if (!MOVES.includes(move)) {
    console.error("Mouvement invalide:", move);
    move = "STAY";
  }

  console.log(`Action décidée: ${action}, Mouvement: ${move}`);

  return {
    action: action,
    move: move,
  };
};

module.exports = {
  getAction,
  logiqueActions,
  logiqueMoves,
};
