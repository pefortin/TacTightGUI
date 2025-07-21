# TacTight - Interface de Traitement de Données

Une application web moderne combinant FastAPI et JavaScript pour le traitement de paramètres (largeur et force) avec génération de fichiers STL.

## Structure du Projet

```
hapstitrap/
├── backend/
│   ├── main.py              # API FastAPI
│   ├── requirements.txt     # Dépendances Python backend
│   ├── Dockerfile          # Configuration Docker backend
│   └── docker-compose.yml  # Orchestration Docker
├── frontend/
│   ├── index.html          # Interface principale
│   ├── styles.css          # Styles CSS
│   ├── script.js           # Logique JavaScript
│   └── server.js           # Serveur Node.js avec proxy
└── README.md               # Documentation
```

## Prérequis

- Python 3.8+ pour le backend
- Node.js 14+ pour le frontend (optionnel)
- Docker et Docker Compose (optionnel, recommandé)

## Installation et Lancement

### Option 1: Lancement avec Docker (Recommandé)

```bash
# Depuis le répertoire backend
cd backend

# Lancer avec Docker Compose
docker-compose up --build

# L'API sera disponible sur http://localhost:8000
```

### Option 2: Lancement Manuel

#### 1. Lancer le Backend

```bash
# Depuis le répertoire racine du projet
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur macOS/Linux:
source venv/bin/activate
# Sur Windows:
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur FastAPI
python main.py
# Ou avec uvicorn directement:
# uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Le backend sera disponible sur : `http://localhost:8000`**
**Documentation API : `http://localhost:8000/docs`**

#### 2. Lancer le Frontend

**Option A: Avec le serveur Node.js intégré (Recommandé)**

```bash
# Depuis le répertoire frontend
cd frontend

# Installer les dépendances Node.js
npm install

# Lancer le serveur avec proxy intégré
npm start
# ou
node server.js
```

**Option B: Serveur HTTP simple**

```bash
# Depuis le répertoire frontend
cd frontend

# Avec Python
python -m http.server 3000

# Avec Node.js (si installé)
npx http-server . -p 3000 --cors

# Avec PHP (si installé)
php -S localhost:3000
```

**Le frontend sera disponible sur : `http://localhost:3000`**

## Configuration des URLs

### Développement Local

- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- Le frontend utilise un proxy vers `/api/` qui redirige vers le backend

### Variables d'Environnement

```bash
# Backend
PORT=8000
API_URL=http://127.0.0.1:8000

# Frontend (pour server.js)
PORT=3000
API_URL=http://127.0.0.1:8000
```

## Fonctionnalités

### Interface Utilisateur

1. **Hero Section** - Présentation du projet TacTight
2. **Problématiques** - Défis scientifiques
3. **Architecture** - Comment ça fonctionne
4. **Interface** - Générateur STL interactif
5. **Équipe** - Informations sur les auteurs
6. **Contact** - Formulaire de contact

### API Endpoints

```bash
GET  /                     # Status de l'API
GET  /generate-stl/        # Génération de fichier STL
POST /contact             # Envoi de message de contact
```

## Utilisation

1. **Lancer les services** (backend + frontend)
2. **Ouvrir le navigateur** sur `http://localhost:3000`
3. **Naviguer** vers la section "Make your Own TacTight"
4. **Saisir les paramètres** :
   - Force désirée (4.92 - 10.40 N)
   - Largeur de sangle (≥ 26 mm)
5. **Générer** le fichier STL personnalisé
6. **Télécharger** le fichier généré

## Développement

### Structure des Fichiers

```bash
# Backend - Ajouter de nouveaux endpoints
backend/main.py

# Frontend - Interface utilisateur
frontend/index.html      # Structure HTML
frontend/styles.css      # Styles et design
frontend/script.js       # Logique et interactions

# Configuration
backend/docker-compose.yml  # Services Docker
frontend/server.js          # Serveur avec proxy
```

### Mode Développement

```bash
# Backend avec rechargement automatique
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend avec rechargement automatique
cd frontend
# Utiliser un serveur avec live-reload comme:
npx live-server --port=3000 --proxy=/api:http://localhost:8000
```

## Dépannage

### Problèmes Courants

**1. Erreur CORS**
```bash
# Vérifier que le backend est lancé sur le bon port
# Le frontend doit pointer vers http://localhost:8000
```

**2. Port déjà utilisé**
```bash
# Changer le port dans la configuration
export PORT=8001  # Pour le backend
export PORT=3001  # Pour le frontend
```

**3. Problèmes de proxy**
```bash
# Vérifier la configuration dans frontend/server.js
# S'assurer que API_URL pointe vers le bon backend
```

**4. Dépendances manquantes**
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend (si utilisation de Node.js)
cd frontend && npm install
```

### Logs de Debug

```bash
# Backend - logs détaillés
cd backend
uvicorn main:app --reload --log-level debug

# Frontend - logs du serveur
cd frontend
DEBUG=* node server.js
```

## Technologies Utilisées

- **Backend**: FastAPI, Python, Uvicorn, SlowAPI (rate limiting)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Node.js (serveur)
- **Containerization**: Docker, Docker Compose
- **API**: RESTful avec support CORS complet
- **Proxy**: HTTP proxy middleware pour développement

## Production

Pour déployer en production :

1. **Construire l'image Docker** : `docker-compose build`
2. **Configurer les variables d'environnement** appropriées
3. **Utiliser un reverse proxy** (Nginx, Traefik)
4. **Configurer HTTPS** et la sécurité
5. **Monitorer les logs** et performances

## Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push sur la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request
