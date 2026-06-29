FROM node:20-bullseye AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-build /app/frontend/dist/ ./static/

EXPOSE 7860
# HF Spaces Docker SDK expects the app to listen on port 7860 by default.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
