# Utiliser Node.js 18 Alpine pour une image légère
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration des dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botwar -u 1001

# Copier le code source
COPY --chown=botwar:nodejs . .

# Exposer le port
EXPOSE 3000

# Changer vers l'utilisateur non-root
USER botwar

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck pour vérifier que l'application fonctionne
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Commande pour démarrer l'application
CMD ["node", "main.js"]