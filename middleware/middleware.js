const dotenv = require("dotenv");
let bombcount = 0;
const maxBombs = 3;

// Variables pour le mode manuel
let manualQueue = []; // Queue des actions manuelles
let lastManualAction = null; // Dernière action manuelle pour répétition

dotenv.config();

const bombLimit = (req, res, next) => {
  const requestedAction =
    (req.query && req.query.action) || (req.body && req.body.action);

  if (requestedAction === "BOMB" && bombcount >= maxBombs) {
    return res.status(400).json({
      error: "Limite de bombes atteinte",
      message: `Maximum ${maxBombs} bombes autorisées`,
      bombsUsed: bombcount,
      maxBombs: maxBombs,
    });
  }
  next();
};
const getBombCount = () => {
  return bombcount;
};
const incrementBombCount = () => {
  if (bombcount < maxBombs) {
    bombcount++;
  }
  return bombcount;
};

const resetBombCount = () => {
  bombcount = 0;
  return bombcount;
};

const errorHandler = (err, req, res, next) => {
  console.error("=== ERREUR DÉTAILLÉE ===");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  console.error("URL:", req.url);
  console.error("Method:", req.method);
  console.error("Query:", req.query);
  console.error("Body:", req.body);
  console.error("========================");

  res.status(500).json({
    error: "Erreur interne du serveur",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Une erreur est survenue",
    // Temporairement pour debug
    debug: {
      message: err.message,
      stack: err.stack.split("\n")[0],
    },
  });
};

// Fonctions pour le mode manuel
const addManualAction = (action, move) => {
  const manualAction = { 
    action, 
    move, 
    timestamp: Date.now(),
    // Marquer comme action manuelle pour la différencier
    isManual: true
  };
  manualQueue.push(manualAction);
  lastManualAction = manualAction;
  console.log(`📝 Action manuelle ajoutée: ${action} - ${move}. Queue: ${manualQueue.length}`);
  return manualQueue.length;
};

const getNextManualAction = () => {
  if (manualQueue.length > 0) {
    const nextAction = manualQueue.shift();
    console.log(`🎮 Action manuelle consommée: ${nextAction.action} - ${nextAction.move}. Restant: ${manualQueue.length}`);
    return nextAction;
  }
  
  // Si pas d'actions en queue mais une dernière action existe, la répéter
  if (lastManualAction) {
    console.log(`🔄 Répétition de la dernière action manuelle: ${lastManualAction.action} - ${lastManualAction.move}`);
    return lastManualAction;
  }
  
  return null;
};

const hasManualActions = () => {
  return manualQueue.length > 0 || lastManualAction !== null;
};

const getManualQueueStatus = () => {
  return {
    hasManualActions: hasManualActions(),
    queueLength: manualQueue.length,
    lastAction: lastManualAction,
    queue: manualQueue.map(action => ({
      action: action.action,
      move: action.move,
      timestamp: action.timestamp
    }))
  };
};

const clearManualQueue = () => {
  manualQueue = [];
  lastManualAction = null;
  console.log('🗑️ Queue manuelle vidée - retour au mode automatique');
  return true;
};


module.exports = {
  incrementBombCount,
  bombLimit,
  errorHandler,
  getBombCount,
  resetBombCount,
 // Fonctions mode manuel simplifié
  addManualAction,
  getNextManualAction,
  hasManualActions,
  getManualQueueStatus,
  clearManualQueue
};
