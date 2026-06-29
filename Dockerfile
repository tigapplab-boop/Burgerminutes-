# Image Node légère — Node 20 sur Alpine Linux.
FROM node:20-alpine

# Dossier de travail dans le conteneur.
WORKDIR /app

# On copie d'abord uniquement package.json pour profiter du cache Docker
# (les dépendances ne sont réinstallées que si package.json change).
COPY package.json ./

# Installation des dépendances de production uniquement.
RUN npm install --omit=dev

# On copie ensuite le reste du code applicatif.
COPY server.js ./
COPY public ./public

# Le dossier data/ sera monté comme volume persistant par Coolify.
# On le crée quand même au cas où, pour le mode hors Coolify.
RUN mkdir -p data

# Port d'écoute (Coolify injectera le sien via process.env.PORT si besoin).
# 8090 choisi pour éviter tout conflit avec un autre service déjà sur le port 3000 du VPS.
ENV PORT=8090
EXPOSE 8090

# Healthcheck : permet à Coolify de savoir automatiquement si le nouveau
# conteneur est en bonne santé avant de basculer le trafic vers lui
# (nécessaire pour un déploiement automatique sans coupure de service).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||8090)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Lancement du serveur.
CMD ["node", "server.js"]
