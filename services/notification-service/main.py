import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from event_consumer import start_consumer

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailNotification(BaseModel):
    to: str
    subject: str
    content: str


app = FastAPI(title="Notification Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Start RabbitMQ consumer on startup"""
    logger.info("Starting Notification Service...")
    start_consumer()
    logger.info("RabbitMQ consumer started")


@app.post("/notifications/email")
def send_email(notification: EmailNotification):
    """HTTP endpoint for sending email (legacy/fallback)"""
    logger.info(f"📧 HTTP: Sending email to {notification.to}")
    return {"status": "queued", "to": notification.to}


@app.get("/health")
def health():
    return {"status": "ok"}
