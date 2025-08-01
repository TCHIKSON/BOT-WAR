const actionService = require("../services/actionService");
const { 
  addManualAction, 
  getManualQueueStatus, 
  clearManualQueue,
  resetBombCount 
} = require("../middleware/middleware");

exports.getAction = async (req, res) =>{
  try {
    // Vérifier si c'est une requête pour ajouter une action manuelle
    const manualAction = (req.body && req.body.manualAction) || (req.query && req.query.manualAction);
    const clearQueue = (req.body && req.body.clearQueue) || (req.query && req.query.clearQueue);
    const resetBot = (req.body && req.body.reset) || (req.query && req.query.reset);
    const getStatus = (req.body && req.body.status) || (req.query && req.query.status);

    // Commandes spéciales via la route /action
    if (manualAction && req.body.action && req.body.move) {
      // Ajouter une action manuelle
      const queueLength = addManualAction(req.body.action, req.body.move);
      return res.status(200).json({
        success: true,
        message: "Action manuelle ajoutée",
        action: req.body.action,
        move: req.body.move,
        queueLength: queueLength,
        timestamp: new Date().toISOString()
      });
    }

    if (clearQueue) {
      // Vider la queue manuelle
      clearManualQueue();
      return res.status(200).json({
        success: true,
        message: "Queue manuelle vidée - retour au mode automatique",
        timestamp: new Date().toISOString()
      });
    }

    if (resetBot) {
      // Reset complet
      resetBombCount();
      clearManualQueue();
      return res.status(200).json({
        success: true,
        message: "Bot réinitialisé complètement",
        bombsUsed: 0,
        timestamp: new Date().toISOString()
      });
    }

    if (getStatus) {
      // Retourner le statut
      const status = getManualQueueStatus();
      return res.status(200).json({
        success: true,
        ...status,
        bombsUsed: require("../middleware/middleware").getBombCount(),
        timestamp: new Date().toISOString()
      });
    }

    // Comportement normal : retourner une action
    const requestedAction =
      (req.query && req.query.action) || (req.body && req.body.action) || "";
    const requestedMove =
      (req.query && req.query.move) || (req.body && req.body.move) || "";
    const gameState =
      (req.body && req.body.gameState) ||
      (req.query && req.query.gameState) ||
      {};

    const result = actionService.getAction(
      requestedAction,
      requestedMove,
      gameState
    );

    if (!result || !result.action || !result.move) {
      return res.status(500).json({
        error: "Erreur dans la génération de l'action",
        message: "Le service n'a pas retourné une action valide",
      });
    }

    res.status(200).json({
      move: result.move,
      action: result.action,
      source: result.source,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error("Erreur dans actionController.getAction:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur est survenue lors du traitement de l'action",
    });
  }
};
