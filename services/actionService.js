const {
  incrementBombCount,
  getBombCount,
  getNextManualAction,
  hasManualActions,
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
  let actionSource = "automatic";

  // PRIORITÉ 1: Si des paramètres sont fournis dans la requête, les utiliser
  if (action && move) {
    console.log("🎯 Utilisation des paramètres de la requête:", { action, move });
    actionSource = "request";
  }
  // PRIORITÉ 2: Si des actions manuelles sont disponibles, les utiliser
  else if (hasManualActions()) {
    const manualAction = getNextManualAction();
    if (manualAction) {
      action = manualAction.action;
      move = manualAction.move;
      actionSource = "manual";
      console.log("🎮 Utilisation d'une action manuelle:", { action, move });
    } else {
      // Fallback au mode automatique
      action = action || logiqueActions(gameState);
      move = move || logiqueMoves(gameState);
      console.log("🤖 Fallback vers mode automatique:", { action, move });
    }
  }
  // PRIORITÉ 3: Mode automatique par défaut
  else {
    action = action || logiqueActions(gameState);
    move = move || logiqueMoves(gameState);
    console.log("🤖 Mode automatique:", { action, move });
  }

  // Vérifier si l'action bomb est valide
  if (action === "BOMB") {
    const currentBombs = getBombCount();
    if (currentBombs >= MAX_BOMBS) {
      console.log("💥 Limite de bombes atteinte, action changée vers COLLECT");
      action = "COLLECT";
    } else {
      incrementBombCount();
      console.log(`💣 Bombe posée. Total: ${getBombCount()}/${MAX_BOMBS}`);
    }
  }

  // Valider les entrées
  if (!ACTIONS.includes(action)) {
    console.error("❌ Action invalide:", action);
    action = "COLLECT";
  }

  if (!MOVES.includes(move)) {
    console.error("❌ Mouvement invalide:", move);
    move = "STAY";
  }

  console.log(`✅ Action finale: ${action}, Mouvement: ${move} (Source: ${actionSource})`);

  return {
    action: action,
    move: move,
    source: actionSource,
    timestamp: new Date().toISOString()  // ← AJOUTÉ pour correspondre au controller
  };
};

module.exports = {
  getAction,
  logiqueActions,
  logiqueMoves,
};