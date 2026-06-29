import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from recommender import search_song, get_hybrid_recommendations

app = FastAPI(title="Resonix Recommender API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    songs: list[str]
    artists: list[str | None] | None = None

@app.post("/recommend")
def recommend(req: RecommendRequest):
    if not req.songs:
        raise HTTPException(status_code=400, detail="Songs list cannot be empty")
    
    artists = req.artists or [None] * len(req.songs)
    if len(artists) != len(req.songs):
        raise HTTPException(status_code=400, detail="Songs and artists lists must have the same length")
        
    matched = []
    track_ids = []
    for song, artist in zip(req.songs, artists):
        if not song or not song.strip():
            continue
        result = search_song(song.strip(), artist_hint=artist.strip() if artist else None)
        if result:
            matched.append(result)
            track_ids.append(result["track_id"])

    if not track_ids:
        raise HTTPException(status_code=404, detail="No matching songs found")

    recs = get_hybrid_recommendations(track_ids, n_cb=5, n_cf=5)
    return {"matched_input": matched, "recommendations": recs}

@app.get("/health")
def health():
    return {"status": "ok"}

# Mount frontend files (fallback to ../frontend/dist in dev if static folder does not exist)
backend_static_dir = os.path.join(os.path.dirname(__file__), "static")
dev_frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(backend_static_dir):
    app.mount("/", StaticFiles(directory=backend_static_dir, html=True), name="static")
elif os.path.exists(dev_frontend_dir):
    app.mount("/", StaticFiles(directory=dev_frontend_dir, html=True), name="static")
