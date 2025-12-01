from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from database import get_db, CartItem as DBCartItem

app = FastAPI(title="Cart Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CartItem(BaseModel):
    product_id: int
    quantity: int

    class Config:
        from_attributes = True


class CartItemResponse(BaseModel):
    id: int
    customer_id: str
    product_id: int
    quantity: int

    class Config:
        from_attributes = True


@app.get("/customers/{customer_id}/cart", response_model=List[CartItemResponse])
def get_cart(customer_id: str, db: Session = Depends(get_db)):
    items = db.query(DBCartItem).filter(DBCartItem.customer_id == customer_id).all()
    return items


@app.post("/customers/{customer_id}/cart", response_model=CartItemResponse, status_code=201)
def add_to_cart(customer_id: str, item: CartItem, db: Session = Depends(get_db)):
    # Check if item already exists
    existing = db.query(DBCartItem).filter(
        DBCartItem.customer_id == customer_id,
        DBCartItem.product_id == item.product_id
    ).first()
    
    if existing:
        existing.quantity += item.quantity
        db.commit()
        db.refresh(existing)
        return existing
    
    new_item = DBCartItem(
        customer_id=customer_id,
        product_id=item.product_id,
        quantity=item.quantity
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@app.put("/customers/{customer_id}/cart/{product_id}", response_model=CartItemResponse)
def update_cart_item(customer_id: str, product_id: int, item: CartItem, db: Session = Depends(get_db)):
    cart_item = db.query(DBCartItem).filter(
        DBCartItem.customer_id == customer_id,
        DBCartItem.product_id == product_id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    cart_item.quantity = item.quantity
    db.commit()
    db.refresh(cart_item)
    return cart_item


@app.delete("/customers/{customer_id}/cart/{product_id}")
def remove_from_cart(customer_id: str, product_id: int, db: Session = Depends(get_db)):
    cart_item = db.query(DBCartItem).filter(
        DBCartItem.customer_id == customer_id,
        DBCartItem.product_id == product_id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    db.delete(cart_item)
    db.commit()
    return {"status": "removed"}


@app.delete("/customers/{customer_id}/cart")
def clear_cart(customer_id: str, db: Session = Depends(get_db)):
    db.query(DBCartItem).filter(DBCartItem.customer_id == customer_id).delete()
    db.commit()
    return {"status": "cleared"}


@app.get("/health")
def health():
    return {"status": "ok"}
