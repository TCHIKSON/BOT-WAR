const actionService = require("../services/actionService");
exports.getAction = async (req, res) => {
  try {
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
    });
  } catch (error) {
    console.error("Erreur dans actionController.getAction:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur est survenue lors du traitement de l'action",
    });
  }
};
