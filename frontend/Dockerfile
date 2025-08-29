# Utiliser une image officielle Node.js
FROM node:18

# Créer le dossier de travail dans le container
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers
COPY . .

# Exposer le port utilisé par ton app Express
EXPOSE 3000

# Lancer l'app en mode production (ou start)
CMD ["node", "server.js"]
