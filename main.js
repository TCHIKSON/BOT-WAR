const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const actionController = require("./controllers/actionController");
const { bombLimit, errorHandler } = require("./middleware/middleware");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: [
    'https://bot.gogokodo.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// ROUTE UNIQUE : /action pour GET et POST
app.get("/action", bombLimit, actionController.getAction);
app.post("/action", bombLimit, actionController.getAction);  // ← AJOUTÉ

app.get("/", (req, res) => {
  res.json({
    message: "Bot-War API is running!",
    version: "2.0.0",  // ← Mis à jour
    endpoints: {
      action: "GET/POST /action - Route unique pour toutes les opérations"
    },
    usage: {
      "Action normale": "GET /action",
      "Action avec paramètres": "GET /action?action=BOMB&move=UP",
      "Ajouter action manuelle": "POST /action { \"manualAction\": true, \"action\": \"BOMB\", \"move\": \"UP\" }",
      "Voir statut": "GET /action?status=true",
      "Vider queue": "POST /action { \"clearQueue\": true }",
      "Reset bot": "POST /action { \"reset\": true }"
    },
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`🚀 Bot-War API démarrée sur le port ${PORT}`);
  console.log(`📍 URL locale: http://localhost:${PORT}`);
  console.log(`🎮 Route unique: http://localhost:${PORT}/action`);
  console.log(`🎯 Mode manuel intégré dans la route principale`);

  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Mode développement activé");
  }
});

// Gestion propre de l'arrêt du serveur
process.on("SIGTERM", () => {
  console.log("⏹️  SIGTERM reçu, arrêt du serveur...");
  server.close(() => {
    console.log("✅ Serveur arrêté proprement");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("⏹️  SIGINT reçu, arrêt du serveur...");
  server.close(() => {
    console.log("✅ Serveur arrêté proprement");
    process.exit(0);
  });
});

module.exports = app;