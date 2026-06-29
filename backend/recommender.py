"""
Real recommender logic for Resonix, replacing the mock used during initial
frontend/backend wiring.

Loads, once at process startup:
  - tracks_clean.csv          -> song metadata + scaled CB audio features' source table
  - cb_feature_matrix.npy     -> scaled audio feature matrix (CB engine)
  - cb_scaler.pkl             -> fitted StandardScaler (kept for reference / future use,
                                  not re-applied here since cb_feature_matrix is already scaled)
  - ncf_song_embeddings.npy   -> learned NCF song embeddings (CF engine)
  - song_to_idx.pkl / idx_to_song.pkl -> id <-> index mappings for the CF embedding matrix

NOTE: playlists_matched.csv and mf_*.npy (the MF baseline) are NOT loaded here.
They were needed for TRAINING and for the "MF vs NCF" comparison in the README/eval
section, but serving recommendations only needs the already-trained NCF embeddings,
not the raw interaction log. Keeping them out of the served backend keeps the
Docker image/HF Space lean.
"""

import ast
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from rapidfuzz import fuzz, process
from sklearn.metrics.pairwise import cosine_similarity

MODELS_DIR = Path(__file__).resolve().parent / "models"

# ---------------------------------------------------------------------------
# Load everything once at import time (process startup), not per-request.
# ---------------------------------------------------------------------------

print("[recommender] Loading tracks_clean.csv...")
tracks = pd.read_csv(MODELS_DIR / "tracks_clean.csv")

# artist_list was saved by Step 1 as a Python list, but round-tripping through
# CSV stores it as the STRING "['gen hoshino']" rather than a real list -- ast.literal_eval
# parses that string representation back into an actual Python list object.
# Falls back to [] for any malformed/empty values rather than crashing on one bad row.
def _parse_artist_list(val):
    try:
        parsed = ast.literal_eval(val) if isinstance(val, str) else val
        return parsed if isinstance(parsed, list) else []
    except (ValueError, SyntaxError):
        return []

tracks["artist_list"] = tracks["artist_list"].apply(_parse_artist_list)

print("[recommender] Loading CB feature matrix...")
cb_feature_matrix = np.load(MODELS_DIR / "cb_feature_matrix.npy")

with open(MODELS_DIR / "cb_scaler.pkl", "rb") as f:
    cb_scaler = pickle.load(f)  # not applied here -- cb_feature_matrix is pre-scaled;
                                  # kept loaded in case a future feature needs to score
                                  # a brand-new song not already in tracks_clean.csv.

print("[recommender] Loading NCF song embeddings + id mappings...")
ncf_song_embeddings = np.load(MODELS_DIR / "ncf_song_embeddings.npy")
with open(MODELS_DIR / "song_to_idx.pkl", "rb") as f:
    song_to_idx = pickle.load(f)
with open(MODELS_DIR / "idx_to_song.pkl", "rb") as f:
    idx_to_song = pickle.load(f)

# Fast lookups, built once.
track_id_to_row = {tid: i for i, tid in enumerate(tracks["track_id"])}
all_norm_titles = tracks["norm_title"].tolist() if "norm_title" in tracks.columns else tracks["track_name"].str.lower().tolist()

CF_COVERAGE_PCT = round(len(song_to_idx) / len(tracks) * 100, 1)
print(f"[recommender] Loaded {len(tracks)} tracks, CF embeddings for {len(song_to_idx)} "
      f"({CF_COVERAGE_PCT}% CF coverage -- the rest use the cold-start CB-proxy fallback).")


# ---------------------------------------------------------------------------
# Search: turn a user-typed song (+ optional artist) into a track_id
# ---------------------------------------------------------------------------

def search_song(query: str, artist_hint: str | None = None):
    """
    Returns a dict {track_name, artists, track_id} for the best fuzzy match,
    or None if nothing reasonable was found. Mirrors the original search_song
    signature/behavior from the training-time scripts.
    """
    if not query or not query.strip():
        return None

    if artist_hint and artist_hint.strip():
        search_pool = (tracks["artists"].str.lower() + " - " + tracks["track_name"].str.lower()).tolist()
        full_query = f"{artist_hint.strip().lower()} - {query.strip().lower()}"
        result = process.extractOne(full_query, search_pool, scorer=fuzz.WRatio, score_cutoff=60)
    else:
        search_pool = tracks["track_name"].str.lower().tolist()
        result = process.extractOne(query.strip().lower(), search_pool, scorer=fuzz.WRatio, score_cutoff=60)

    if result is None:
        return None

    _, _, pos = result
    row = tracks.iloc[pos]
    return {"track_name": row["track_name"], "artists": row["artists"], "track_id": row["track_id"]}


# ---------------------------------------------------------------------------
# Content-Based engine
# ---------------------------------------------------------------------------

def get_cb_recommendations(input_track_ids, top_n, exclude_ids=None):
    exclude_ids = exclude_ids or []
    if not isinstance(input_track_ids, list):
        input_track_ids = [input_track_ids]

    positions = [track_id_to_row[tid] for tid in input_track_ids if tid in track_id_to_row]
    if not positions:
        return pd.DataFrame(columns=["track_id", "track_name", "artists", "similarity"])

    query_vector = cb_feature_matrix[positions].mean(axis=0).reshape(1, -1)
    similarities = cosine_similarity(query_vector, cb_feature_matrix).flatten()

    sim_df = pd.DataFrame({
        "track_id": tracks["track_id"],
        "track_name": tracks["track_name"],
        "artists": tracks["artists"],
        "similarity": similarities,
    })
    all_exclude = set(exclude_ids) | set(input_track_ids)
    sim_df = sim_df[~sim_df["track_id"].isin(all_exclude)]
    return sim_df.sort_values("similarity", ascending=False).head(top_n).reset_index(drop=True)


# ---------------------------------------------------------------------------
# Collaborative Filtering engine, with cold-start fallback
# ---------------------------------------------------------------------------

def resolve_cf_proxy(track_id):
    """If track_id has no CF embedding, borrow the embedding of the most
    content-similar track that DOES have one. Returns None only if track_id
    isn't even in the CB catalogue at all."""
    if track_id in song_to_idx:
        return track_id
    if track_id not in track_id_to_row:
        return None

    query_vector = cb_feature_matrix[track_id_to_row[track_id]].reshape(1, -1)
    cf_known_ids = list(song_to_idx.keys())
    cf_known_positions = [track_id_to_row[tid] for tid in cf_known_ids if tid in track_id_to_row]
    cf_known_ids_filtered = [tid for tid in cf_known_ids if tid in track_id_to_row]
    if not cf_known_positions:
        return None

    candidate_vectors = cb_feature_matrix[cf_known_positions]
    similarities = cosine_similarity(query_vector, candidate_vectors).flatten()
    best_idx = similarities.argmax()
    return cf_known_ids_filtered[best_idx]


def get_cf_recommendations(input_track_ids, top_n, exclude_ids=None):
    exclude_ids = exclude_ids or []
    if not isinstance(input_track_ids, list):
        input_track_ids = [input_track_ids]

    resolved_ids = [r for r in (resolve_cf_proxy(tid) for tid in input_track_ids) if r is not None]
    if not resolved_ids:
        return pd.DataFrame(columns=["track_id", "similarity"])

    input_indices = [song_to_idx[tid] for tid in resolved_ids]
    query_vector = ncf_song_embeddings[input_indices].mean(axis=0).reshape(1, -1)
    similarities = cosine_similarity(query_vector, ncf_song_embeddings).flatten()

    all_exclude = set(exclude_ids) | set(input_track_ids) | set(resolved_ids)
    exclude_idx_set = {song_to_idx[tid] for tid in all_exclude if tid in song_to_idx}

    sim_pairs = [(idx_to_song[i], similarities[i]) for i in range(len(similarities)) if i not in exclude_idx_set]
    sim_pairs.sort(key=lambda x: x[1], reverse=True)
    return pd.DataFrame(sim_pairs[:top_n], columns=["track_id", "similarity"])


# ---------------------------------------------------------------------------
# Hybrid combiner -- this is what main.py actually calls
# ---------------------------------------------------------------------------

def get_hybrid_recommendations(input_track_ids, n_cb: int = 5, n_cf: int = 5):
    """
    Returns a list of dicts (NOT a DataFrame) matching the API contract:
    [{track_name, artists, source, spotify_url, track_id}, ...]
    main.py expects a JSON-serializable structure, so we convert here.
    """
    if not isinstance(input_track_ids, list):
        input_track_ids = [input_track_ids]

    OVERSAMPLE_BUFFER = 10
    cb_candidates = get_cb_recommendations(input_track_ids, top_n=n_cb + OVERSAMPLE_BUFFER)
    cf_candidates = get_cf_recommendations(input_track_ids, top_n=n_cf + OVERSAMPLE_BUFFER)

    cb_ids_taken, cf_ids_taken = set(), set()
    final_rows = []

    for _, row in cb_candidates.iterrows():
        if len(cb_ids_taken) >= n_cb:
            break
        if row["track_id"] not in cb_ids_taken:
            cb_ids_taken.add(row["track_id"])
            final_rows.append({"track_id": row["track_id"], "source": "CB"})

    for _, row in cf_candidates.iterrows():
        if len(cf_ids_taken) >= n_cf:
            break
        if row["track_id"] not in cb_ids_taken and row["track_id"] not in cf_ids_taken:
            cf_ids_taken.add(row["track_id"])
            final_rows.append({"track_id": row["track_id"], "source": "CF"})

    total_taken = cb_ids_taken | cf_ids_taken
    target_total = n_cb + n_cf
    if len(final_rows) < target_total:
        backfill_pool = pd.concat([cb_candidates, cf_candidates])
        for _, row in backfill_pool.iterrows():
            if len(final_rows) >= target_total:
                break
            if row["track_id"] not in total_taken:
                total_taken.add(row["track_id"])
                final_rows.append({"track_id": row["track_id"], "source": "CB/CF"})

    result_df = pd.DataFrame(final_rows)
    if result_df.empty:
        return []
    result_df = result_df.merge(tracks[["track_id", "track_name", "artists"]], on="track_id", how="left")
    result_df["spotify_url"] = "https://open.spotify.com/track/" + result_df["track_id"]

    return result_df[["track_name", "artists", "source", "spotify_url", "track_id"]].to_dict(orient="records")
