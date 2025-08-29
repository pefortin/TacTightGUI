# TacTight - Data Processing Interface

A modern web application combining FastAPI and JavaScript for parameter processing (width and force) with STL file generation.

## About TacTight

TacTight is a simple, compact, fully 3D-printed mechanical system designed to standardize the contact force between wearable devices and the skin. Born from the frustration of inconsistent device attachment methods in research settings, TacTight provides an objective solution to replace subjective perceptions of "tight enough" with a reliable visual indicator system.

This research project is funded by **UQAC (Université du Québec à Chicoutimi)**, **Mitacs**, and **NSERC (Natural Sciences and Engineering Research Council of Canada)**.

**Key Features:**
- **No electronics required** - Purely mechanical system
- **Quick to produce** - 3D printable in under 30 minutes
- **Cost-effective** - Uses only a few cents worth of PLA material
- **Standardized coupling** - Ensures consistent skin-device contact force
- **Research-grade reliability** - Significantly improves repeatability compared to subjective methods

The system works by integrating with existing straps or bands and using visual alignment indicators to achieve approximately the intended contact force, making it ideal for researchers working with wearable sensors, haptic devices, and physiological monitoring equipment.

## Project Structure

```
hapstitrap/
├── backend/
│   ├── main.py              # FastAPI API
│   ├── requirements.txt     # Python backend dependencies
│   ├── TacTight.scad        # Launch Tactight install on docker
│   ├── baseFiles            # Contain data for STL
│   ├── output               # Store STL file generated
│   └── Dockerfile           # Backend Docker configuration
├── frontend/
│   ├── index.html          # Main interface
│   ├── styles.css          # CSS styles
│   ├── script.js           # JavaScript logic
│   ├── server.js           # Node.js server with proxy
│   └── Dockerfile          # Backend Docker configuration
└── docker-compose.yml   # Docker orchestration
└── README.md               # Documentation
```

## Prerequisites

- Python 3.8+ for backend
- Node.js 14+ for frontend (optional)
- Docker and Docker Compose (optional, recommended) config

## Installation and Launch

### Option : Launch project

```bash
# Launch with Docker Compose
docker-compose up --build

# TO Stop Docker Compose
docker-compose down
```
   
**The API will be available at: `http://localhost:8000`**

**The frontend will be available at: `http://localhost:3000`**

## URL Configuration

### Local Development

- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:3000`

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
frontend/docker-compose.yml  # Docker services
```

### Development Mode

```bash
# Backend with auto-reload
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend with auto-reload
cd frontend
# Use a server with live-reload like:
npx live-server --port=3000 --proxy=/api:http://localhost:8010
```

## Technologies Used

- **Backend**: FastAPI, Python, Uvicorn, SlowAPI (rate limiting)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Node.js (server)
- **Containerization**: Docker, Docker Compose
- **API**: RESTful with full CORS support
- **Proxy**: HTTP proxy middleware for development

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



