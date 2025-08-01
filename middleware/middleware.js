const dotenv = require("dotenv");
let bombcount = 0;
const maxBombs = 3;

dotenv.config();

const bombLimit = (req, res, next) => {
  const requestedAction = (req.query && req.query.action) || (req.body && req.body.action);

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
    message: process.env.NODE_ENV === "development" ? err.message : "Une erreur est survenue",
    // Temporairement pour debug
    debug: {
      message: err.message,
      stack: err.stack.split('\n')[0]
    }
  });
};

module.exports = {
  incrementBombCount,
  bombLimit,
  errorHandler,
  getBombCount,
  resetBombCount
};
