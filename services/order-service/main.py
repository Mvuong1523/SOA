import os
from typing import List
from decimal import Decimal

from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, Order as DBOrder, OrderItem as DBOrderItem

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "devsecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

app = FastAPI(title="Order Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OrderItem(BaseModel):
    product_id: int
    quantity: int
    price: float | None = None
    product_name: str | None = None  # Optional for input

    class Config:
        from_attributes = True


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str | None = None
    quantity: int
    price: float

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    customer_id: str
    items: List[OrderItem]
    note: str | None = None
    payment_method: str = "COD"


class Order(BaseModel):
    id: int
    customer_id: str
    items: List[OrderItemResponse]
    note: str | None = None
    payment_method: str
    status: str
    total_amount: float | None = None

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str


def _require_admin(auth_header: str | None):
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing/invalid Authorization")
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin role required")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.post("/orders", response_model=Order, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # Calculate total amount
    total = sum(item.price * item.quantity for item in payload.items if item.price)
    
    order = DBOrder(
        customer_id=payload.customer_id,
        note=payload.note,
        payment_method=payload.payment_method,
        status="pending",
        total_amount=Decimal(str(total)) if total > 0 else None
    )
    db.add(order)
    db.flush()
    
    # Add order items
    for item in payload.items:
        order_item = DBOrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product_name,  # Store product name (data duplication)
            quantity=item.quantity,
            price=Decimal(str(item.price)) if item.price else Decimal("0")
        )
        db.add(order_item)
    
    db.commit()
    db.refresh(order)
    return order


@app.get("/orders", response_model=List[Order])
def list_orders(db: Session = Depends(get_db)):
    orders = db.query(DBOrder).all()
    return orders


@app.get("/orders/{order_id}", response_model=Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.put("/orders/{order_id}/status", response_model=Order)
def update_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None)
):
    _require_admin(authorization)
    order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


@app.get("/health")
def health():
    return {"status": "ok"}
