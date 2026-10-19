FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py security.py storage.py ./

# Env vars read by main.py/security.py/storage.py at startup — override at
# `docker run -e` / compose time; these are documented defaults, not secrets.
#   NIDS_API_KEY        required to call any mutating endpoint (fail-closed
#                        except loopback-only access when unset)
#   NIDS_DB_PATH         SQLite file path for persistence (default: ./nids_data.db)
#   NIDS_CORS_ORIGINS    comma-separated allowed frontend origins
#   NIDS_DEV_RELOAD      set "1" to enable uvicorn --reload (dev only, default off)
#   LAB_TARGET_HOST / LAB_SENSOR_HOST / LAB_ATTACKER_HOST / LAB_SUBNET
#                        two-PC lab network config, see .env.example
ENV NIDS_DB_PATH=/app/data/nids_data.db

RUN useradd --create-home --shell /usr/sbin/nologin appuser \
    && mkdir -p /app/data \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/status', timeout=3).status == 200 else 1)"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
