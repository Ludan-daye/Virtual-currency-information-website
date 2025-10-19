from __future__ import annotations

import os

from app import app
from app.config import settings


if __name__ == "__main__":
    port = int(os.getenv("PORT", settings.port))
    app.run(host="0.0.0.0", port=port)
