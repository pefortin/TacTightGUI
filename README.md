# HapsTitrap - Interface de Traitement de Données

Une application web moderne combinant FastAPI et JavaScript pour le traitement de paramètres (largeur et force) avec génération de fichiers.

## Structure du Projet

```
hapstitrap/
├── backend/
│   └── main.py          # API FastAPI
├── frontend/
│   ├── index.html       # Interface principale
│   ├── styles.css       # Styles CSS
│   └── script.js        # Logique JavaScript
├── requirements.txt     # Dépendances Python
└── README.md           # Documentation
```

## Installation et Lancement

### 1. Installation des dépendances

```bash
# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur macOS/Linux:
source venv/bin/activate
# Sur Windows:
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt
```

### 2. Lancer le backend FastAPI

```bash
# Depuis le répertoire racine
cd backend
python main.py

# Ou avec uvicorn directement:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

L'API sera disponible sur : `http://localhost:8000`
Documentation automatique : `http://localhost:8000/docs`

### 3. Lancer le frontend

```bash
# Option 1: Serveur simple Python
cd frontend
python -m http.server 3000

# Option 2: Serveur simple Node.js (si installé)
npx http-server . -p 3000

# Option 3: Ouvrir directement index.html dans le navigateur
```

Le site web sera disponible sur : `http://localhost:3000`

## Fonctionnalités

### Sections du Site

1. **Problématiques** - Présentation des défis
2. **Informations Générales** - Vue d'ensemble du projet
3. **Utilisation** - Interface pour entrer les paramètres
4. **Auteurs** - Informations sur l'équipe
5. **Publications** - Références et publications

### Fonctionnalités Principales

- ✅ Navigation fluide avec barre supérieure
- ✅ Sidebar droite pour suivi de section
- ✅ Formulaire de saisie des paramètres
- ✅ Traitement des données en temps réel
- ✅ Génération et téléchargement de fichiers CSV
- ✅ Interface responsive
- ✅ Design moderne avec animations

## API Endpoints

### POST /process
Traite les paramètres largeur et force
```json
{
  "largeur": 10.5,
  "force": 25.3
}
```

### POST /generate-file
Génère un fichier CSV téléchargeable
```json
{
  "largeur": 10.5,
  "force": 25.3
}
```

## Utilisation

1. Lancez le backend FastAPI
2. Ouvrez le frontend dans votre navigateur
3. Naviguez vers la section "Utilisation"
4. Entrez les valeurs de largeur et force
5. Cliquez sur "Traiter les Données" pour voir les résultats
6. Cliquez sur "Générer Fichier" pour télécharger un CSV

## Technologies Utilisées

- **Backend**: FastAPI, Python, Uvicorn
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: CSS Grid, Flexbox, Animations CSS
- **API**: RESTful avec support CORS

## Développement

Pour modifier l'application :

1. **Backend** : Modifiez `backend/main.py` pour ajouter de nouveaux endpoints
2. **Frontend** : Modifiez les fichiers dans `frontend/` pour l'interface
3. **Styling** : Ajustez `frontend/styles.css` pour le design
4. **Logique** : Modifiez `frontend/script.js` pour les fonctionnalités

Le serveur FastAPI se recharge automatiquement avec l'option `--reload`.
