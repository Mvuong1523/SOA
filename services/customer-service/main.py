from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, Customer as DBCustomer

app = FastAPI(title="Customer Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Customer(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None = None
    address: str | None = None

    class Config:
        from_attributes = True


@app.get("/customers/{customer_id}", response_model=Customer)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(DBCustomer).filter(DBCustomer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.get("/health")
def health():
    return {"status": "ok"}
