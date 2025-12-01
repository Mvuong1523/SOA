import os
import datetime
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, User as DBUser

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "devsecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

app = FastAPI(title="Auth Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _extract_token(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return authorization.split(" ", 1)[1]


def _create_token(customer_id: str, role: str) -> str:
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": customer_id, "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.username == payload.username).first()
    if not user or user.password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = _create_token(user.customer_id, user.role)
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/validate")
def validate_token(authorization: str = Header(...)):
    token = _extract_token(authorization)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        customer_id = payload.get("sub")
        role = payload.get("role")
        if not customer_id:
            raise HTTPException(status_code=401, detail="Token missing subject")
        return {"customer_id": str(customer_id), "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


@app.get("/health")
def health():
    return {"status": "ok"}
