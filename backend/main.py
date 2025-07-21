from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import FileResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import subprocess
import datetime
import os

app = FastAPI()

# Set up rate limiting: 1 request per 20 seconds per client (by IP)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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

    # Explicit error messages for range violation (in case, for some reason, Query is bypassed)
    if strapWidth < 26:
        raise HTTPException(status_code=400, detail="strapWidth must be at least 26 mm.")
    if springThickness < 3 or springThickness > 5:
        raise HTTPException(status_code=400, detail="springThickness must be between 3 and 5 mm.")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = "/tmp"
    filename = f"TacTight_{timestamp}.stl"
    output_path = os.path.join(output_dir, filename)

    scad_file = "TacTight.scad"
    cmd = [
        "openscad",
        "-o", output_path,
        f"-DthicknessSpring={springThickness}",
        f"-DstrapWidth={strapWidth}",
        scad_file,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise HTTPException(
            status_code=400,
            detail=f"OpenSCAD error: {result.stderr}"
        )

    return FileResponse(output_path, filename=filename, media_type='application/sla')
