---
title: Resonix Recommender
emoji: 🎵
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# 🎵 Resonix — Hybrid AI Music Recommender Web Application

<div align="center">
  
  [![Python Version](https://img.shields.io/badge/python-3.11-green.svg?style=flat-square&logo=python)](https://www.python.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-19.0-blue.svg?style=flat-square&logo=react)](https://react.dev/)
  [![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg?style=flat-square&logo=docker)](https://www.docker.com/)
  [![HuggingFace Spaces](https://img.shields.io/badge/HuggingFace-Spaces-yellow.svg?style=flat-square&logo=huggingface)](https://huggingface.co/spaces)

  **A hybrid song recommender combining neural collaborative filtering (NCF) and tabular audio-feature similarity, packaged inside an interactive glassmorphic landing page.**
  
  [Live Production URL](https://inpersonin-resonix.hf.space)

</div>

---

## 🚀 Key Visual & Interactive Features

Resonix is designed to feel alive, responsive, and tactile. It leverages modern web mechanics to create a premium landing experience:

*   **Custom Trailing Cursor Glow**: A physics-based mouse trailer LERP loop that renders a custom outer neon green halo and active core.
*   **3D Ambient Ring Field**: A React Three Fiber scene of dark, glassy torus forms drifting slowly behind all content, lit with a green rim light to match the brand accent.
*   **Live Example Search Chips**: Tappable example tracks confirmed to exist in the trained catalogue, pre-filling the search form and scrolling to it for an instant real demo.
*   **Dynamic Serving Architecture Graph**: An interactive node topology showing real connection lines where native SVG `<animateMotion>` packets carry green data flows from the FastAPI process down to the in-memory CB/CF matrices.
*   **Console Logging Terminal**: A terminal logger simulator built into the architecture card, cycling through the actual request steps `recommender.py` performs (fuzzy search, cosine similarity, cold-start fallback).
*   **Lenis Inertia Scrolling**: Unified smooth kinetic inertia scrolling across the entire page.
*   **GSAP Entrance & ScrollTrigger Timelines**: Staggered loads for cards, headers, and grid lists that fade/slide dynamically into view as the page scrolls.

---

## 🛠️ Technology Stack

### Frontend Architecture
*   **Framework**: [React 19](https://react.dev/) (Vite compilation bundle)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Frosted Glassmorphism theme config)
*   **Animations**: [GSAP (GreenSock)](https://gsap.com/) & [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
*   **Smooth Scroll**: [Lenis](https://lenis.darkroom.engineering/)

### Backend Service
*   **API Framework**: [FastAPI (Python 3.11)](https://fastapi.tiangolo.com/)
*   **Production Server**: [Uvicorn](https://www.uvicorn.org/)
*   **Deployment**: [Docker](https://www.docker.com/) & [HuggingFace Spaces Docker SDK](https://huggingface.co/docs/hub/spaces-sdks-docker)

---

## 📊 System Architecture & Topology

```
                   [ USER CLIENT (React, Vite build) ]
                          │  fetch('/recommend')
                          ▼
            [ FASTAPI (single process, HF Spaces Docker, :7860) ]
                          │
                          ▼
              [ recommender.py (in-process, in-memory) ]
                /                                  \
   [ CB: cb_feature_matrix.npy ]      [ CF: ncf_song_embeddings.npy ]
   (81,343 tracks x 10 features)      (20,255 songs x 32D, NCF-trained)
```

There is no separate load balancer, inference server, or vector database --
the entire recommender (CB cosine similarity + NCF embedding lookup + the
cold-start fallback) runs inside one FastAPI process, with all trained
artifacts loaded into memory at startup from `backend/models/`.

### Recommendation Logic (`recommender.py`)
1.  **Matched Input Identification**: Resolves search parameters (Single Track input or batch line-separated paste) against the 81,343-track catalogue using `rapidfuzz`.
2.  **Hybrid Recommendation Compilation**:
    *   **5 Content-Based (CB) Matches**: Cosine similarity over 10 scaled tabular audio features (danceability, energy, valence, tempo, and more) -- no audio signal processing.
    *   **5 Collaborative Filtering (CF) Matches**: Cosine similarity over NCF song embeddings (32D), trained on 2.21M real playlist interactions with implicit feedback and negative sampling. Only 20,255 of the 81,343 tracks (24.9%) have a learned embedding; the rest use the cold-start fallback below.
    *   **Cold-Start Fallback**: For tracks with no CF embedding, borrows the embedding of the most content-similar track that does have one.
    *   **Dedup + Backfill**: Merges both lists, removes duplicates, and backfills from whichever engine has spare candidates so every query returns a full 10-track list.
3.  **Output Compilation**: Enriches matches with track name, artist, and a direct link to `open.spotify.com/track/{id}`.

> **Known limitation**: offline ranking metrics (NDCG, Recall@K) have not been computed against a held-out evaluation split -- the numbers in this README are dataset/pipeline statistics, not benchmark scores. Recommendation quality also reflects the size and diversity of the training playlists; results can include genre-mismatched tracks, particularly for cold-start songs resolved via the CB proxy.

---

## 📂 Project Structure

```
.
├── Dockerfile                   # Deployment container blueprint (serves compiled static folder)
├── README.md                    # Project documentation (Hugging Face metadata frontmatter)
├── push_to_hf.py                # Space uploader script (excluding node_modules)
├── backend/                     # API Server Folder
│   ├── main.py                  # FastAPI server and static folder mounts
│   ├── recommender.py           # Real hybrid recommender (CB + NCF, loads models/ at startup)
│   ├── models/                  # Trained artifacts (tracks_clean.csv, .npy embeddings, .pkl mappings)
│   └── requirements.txt         # Python library manifest
└── frontend/                    # React Client Folder
    ├── package.json             # NPM dependencies (React 19, Tailwind v4, React Three Fiber v9)
    ├── vite.config.js           # Vite build pipeline imports
    ├── index.html               # Main index mounting point and GSAP CDNs
    └── src/
        ├── App.jsx              # Consolidated Discover and Studios layout
        ├── main.jsx             # React DOM root render
        ├── index.css            # Custom CSS animations & Tailwind imports
        └── components/          # Interactive dashboard widgets
            ├── SceneBackground3D.jsx    # React Three Fiber dark/glass ring field background
            ├── CustomCursor.jsx          # LERP trailing neon cursor
            └── ServingArchitecture.jsx   # Animated SVG connection layout (real topology)
```

---

## 💻 Getting Started (Local Development)

### Prerequisites
*   Node.js (v18 or higher)
*   Python 3.9+
*   Git

### 1. Set Up and Compile Frontend React App
Navigate to the frontend folder, install dependencies, and build the static production assets:
```bash
cd frontend
npm install
npm run build
```
This compiles the code into `frontend/dist`.

### 2. Set Up and Start Backend Server
Navigate to the root folder (or backend directory), create a virtual environment, install python libraries, and run the FastAPI server:
```bash
# Create virtual environment
python -m venv .venv
# Activate on Windows:
.venv\Scripts\activate
# Activate on macOS/Linux:
source .venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt

# Run FastAPI app (points to frontend/distFallback automatically)
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
Open `http://127.0.0.1:8000` in your web browser.

---

## 🐳 Docker Execution

To package and run the application locally using Docker:
```bash
# Build the image
docker build -t resonix-app .

# Run the container mapping port 7860
docker run -p 7860:7860 resonix-app
```
Open `http://localhost:7860` to access the local deployment.

---

## 💾 Deployment to Hugging Face Spaces

The deployment pipeline is fully automated via `push_to_hf.py`.

1.  Set your Hugging Face credentials in your terminal session:
    ```powershell
    # Windows PowerShell:
    $env:HF_TOKEN = "your_hf_token"
    $env:HF_SPACE_ID = "your_username/resonix"
    
    # macOS/Linux Bash:
    export HF_TOKEN="your_hf_token"
    export HF_SPACE_ID="your_username/resonix"
    ```
2.  Run the upload deployer script:
    ```bash
    python push_to_hf.py
    ```
This ignores dev dependencies like `node_modules` and triggers a Docker container build in your Space repository.

---

## 📄 License
This project is open-source and available under the MIT License.
