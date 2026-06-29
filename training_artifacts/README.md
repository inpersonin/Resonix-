# Training Artifacts (not shipped in the Docker image)

These files were needed to TRAIN the model but are not loaded by `backend/recommender.py`
at serving time. Kept here for reproducibility / future retraining, not copied into the
Docker image (see `Dockerfile`, which only `COPY backend/` — this folder is a sibling,
not a subdirectory of `backend/`).

- `playlists_matched.csv` — the matched playlist-track interaction log (Step 1 output).
  Needed to retrain the CF model from scratch; not needed to serve recommendations,
  since the trained embeddings already encode everything the model learned from it.
- `mf_song_embeddings.npy` / `mf_playlist_embeddings.npy` — the Matrix Factorization
  (SVD) baseline embeddings, kept for the MF-vs-NCF comparison, not used by the API.
- `Resonix_Model.pt` — the full NCF model state dict (includes playlist embeddings
  and MLP weights). `backend/models/ncf_song_embeddings.npy` is the only part of this
  actually needed at inference time (the extracted song embedding layer); the rest of
  the model graph isn't needed once embeddings are extracted, since the API only
  serves nearest-neighbor lookups, not live forward passes through the network.
