const dotenv = require("dotenv");
const bombcount = 0;
const maxBombs = 3;

dotenv.config();

const bombLimit = (req, res, next) => {
  const requestedAction = req.query.action || req.body.action;

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

const errorHandler = (err, req, res, next) => {
  console.error("Erreur:", err.stack);
  res.status(500).json({
    error: "Erreur interne du serveur",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Une erreur est survenue",
  });
};

module.exports = {
  incrementBombCount,
  bombLimit,
  errorHandler,
  getBombCount,
};
