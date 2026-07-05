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

# Port d'écoute (Coolify injectera le sien via process.env.PORT).
ENV PORT=3000
EXPOSE 3000

# Lancement du serveur.
CMD ["node", "server.js"]
