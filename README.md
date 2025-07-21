# TacTight - Data Processing Interface

A modern web application combining FastAPI and JavaScript for parameter processing (width and force) with STL file generation.

## Project Structure

```
hapstitrap/
├── backend/
│   ├── main.py              # FastAPI API
│   ├── requirements.txt     # Python backend dependencies
│   ├── Dockerfile          # Backend Docker configuration
│   └── docker-compose.yml  # Docker orchestration
├── frontend/
│   ├── index.html          # Main interface
│   ├── styles.css          # CSS styles
│   ├── script.js           # JavaScript logic
│   └── server.js           # Node.js server with proxy
└── README.md               # Documentation
```

## Prerequisites

- Python 3.8+ for backend
- Node.js 14+ for frontend (optional)
- Docker and Docker Compose (optional, recommended)

## Installation and Launch

### Option 1: Launch with Docker (Recommended)

```bash
# From the backend directory
cd backend

# Launch with Docker Compose
docker-compose up --build

# The API will be available at http://localhost:8000

# Stop Docker Compose
docker-compose down
```

**The backend will be available at: `http://localhost:8000`**
**API Documentation: `http://localhost:8000/docs`**

#### 2. Launch the Frontend

**Option A: With integrated Node.js server (Recommended)**

```bash
# From the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Launch server with integrated proxy
npm start
# or
node server.js
```

**The frontend will be available at: `http://localhost:3000`**

## URL Configuration

### Local Development

- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- The frontend uses a proxy to `/api/` which redirects to the backend

## Features

### User Interface

1. **Hero Section** - TacTight project presentation
2. **Problems** - Scientific challenges
3. **Architecture** - How it works
4. **Interface** - Interactive STL generator
5. **Team** - Information about the authors
6. **Contact** - Contact form

## Usage

1. **Launch services** (backend + frontend)
2. **Open browser** at `http://localhost:3000`
3. **Navigate** to the "Make your Own TacTight" section
4. **Enter parameters**:
   - Desired force (4.92 - 10.40 N)
   - Strap width (≥ 26 mm)
5. **Generate** the custom STL file
6. **Download** the generated file

## Development

### File Structure

```bash
# Backend - Add new endpoints
backend/main.py

# Frontend - User interface
frontend/index.html      # HTML structure
frontend/styles.css      # Styles and design
frontend/script.js       # Logic and interactions

# Configuration
backend/docker-compose.yml  # Docker services
frontend/server.js          # Server with proxy
```

### Development Mode

```bash
# Backend with auto-reload
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend with auto-reload
cd frontend
# Use a server with live-reload like:
npx live-server --port=3000 --proxy=/api:http://localhost:8000
```

## Technologies Used

- **Backend**: FastAPI, Python, Uvicorn, SlowAPI (rate limiting)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Node.js (server)
- **Containerization**: Docker, Docker Compose
- **API**: RESTful with full CORS support
- **Proxy**: HTTP proxy middleware for development



