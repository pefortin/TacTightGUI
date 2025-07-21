from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import subprocess
import datetime
import os
import shutil

app = FastAPI()

# Add CORS middleware
app.add_middleware(
CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "*"  # Garde ceci en dernier recours
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type", "Content-Length"],
)

# Set up rate limiting: 1 request per 20 seconds per client (by IP)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

@app.get("/")
async def root():
    return {"message": "Haptistrap API is running"}

@app.get("/generate-stl/")
@limiter.limit("1/20 seconds")
async def generate_stl(
    request: Request,
    springThickness: float = Query(
        3.0, ge=3.0, le=5.0,
        description="Spring thickness (mm), must be between 3 and 5 inclusive"
    ),
    strapWidth: float = Query(
        26.0, ge=26.0,
        description="Strap width (mm), must be at least 26"
    ),
):

    if strapWidth < 26:
        raise HTTPException(status_code=400, detail="strapWidth must be at least 26 mm.")
    if springThickness < 3 or springThickness > 5:
        raise HTTPException(status_code=400, detail="springThickness must be between 3 and 5 mm.")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    # Répertoire de sortie temporaire
    output_dir = "/backend/output"
    
    # Créer le répertoire s'il n'existe pas
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"TacTight_{timestamp}.stl"
    output_path = os.path.join(output_dir, filename)

    # Créer aussi un répertoire local pour sauvegarder les copies
    local_save_dir = os.path.join(os.path.dirname(__file__), "generated_stl")
    os.makedirs(local_save_dir, exist_ok=True)
    local_save_path = os.path.join(local_save_dir, filename)

    scad_file = "TacTight.scad"
    cmd = [
        "openscad",
        "-o", output_path,
        f"-DspringThickness={springThickness}",
        f"-DstrapWidth={strapWidth}",
        scad_file,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"OpenSCAD error: {result.stderr}"
        )

    if not os.path.exists(output_path):
        raise HTTPException(
            status_code=500,
            detail="STL file was not generated"
        )

    # Sauvegarder une copie locale pour observation
    try:
        shutil.copy2(output_path, local_save_path)
        print(f"Copie sauvegardée localement : {local_save_path}")
    except Exception as e:
        print(f"Erreur lors de la sauvegarde locale : {e}")
        # Ne pas interrompre le processus si la sauvegarde locale échoue

    return FileResponse(
        output_path, 
        filename=filename, 
        media_type='application/sla',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )