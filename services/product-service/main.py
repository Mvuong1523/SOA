import os
from typing import List

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, Product as DBProduct

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "devsecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

app = FastAPI(title="Product Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Product(BaseModel):
    id: int
    name: str
    price: float
    inventory: int
    description: str | None = None

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    price: float
    inventory: int = 0
    description: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
    inventory: int | None = None
    description: str | None = None


class StockUpdate(BaseModel):
    quantity: int


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


@app.get("/products", response_model=List[Product])
def list_products(db: Session = Depends(get_db)):
    products = db.query(DBProduct).all()
    return products


@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.post("/products", response_model=Product, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None)
):
    _require_admin(authorization)
    product = DBProduct(**payload.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@app.put("/products/{product_id}", response_model=Product)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None)
):
    _require_admin(authorization)
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product


@app.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None)
):
    _require_admin(authorization)
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        db.delete(product)
        db.commit()
    except Exception as e:
        db.rollback()
        # Check if it's a foreign key constraint error
        if "foreign key constraint" in str(e).lower() or "still referenced" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="Cannot delete product. It is referenced in existing orders or cart items. Please remove it from orders/carts first."
            )
        # Re-raise other exceptions
        raise HTTPException(status_code=500, detail=f"Failed to delete product: {str(e)}")
    
    return None


@app.get("/products/{product_id}/stock")
def check_stock(product_id: int, quantity: int, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"available": product.inventory >= quantity, "current_stock": product.inventory}


@app.put("/products/{product_id}/stock", response_model=Product)
def update_stock(product_id: int, update: StockUpdate, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_inventory = product.inventory - update.quantity
    if new_inventory < 0:
        raise HTTPException(status_code=400, detail="Insufficient inventory")
    
    product.inventory = new_inventory
    db.commit()
    db.refresh(product)
    return product


@app.get("/health")
def health():
    return {"status": "ok"}
