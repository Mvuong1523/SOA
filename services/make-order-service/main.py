import os
from typing import List

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from common.http_client import request_with_cb


class OrderItem(BaseModel):
    product_id: int
    quantity: int


class OrderingRequest(BaseModel):
    customer_id: str
    items: List[OrderItem]
    note: str | None = None
    payment_method: str = "COD"


SERVICE_URLS = {
    "auth": os.getenv("AUTH_URL", "http://auth-service:8001"),
    "customer": os.getenv("CUSTOMER_URL", "http://customer-service:8003"),
    "product": os.getenv("PRODUCT_URL", "http://product-service:8002"),
    "order": os.getenv("ORDER_URL", "http://order-service:8005"),
    "notification": os.getenv("NOTIF_URL", "http://notification-service:8006"),
    "cart": os.getenv("CART_URL", "http://cart-service:8004"),
}

app = FastAPI(title="Make-Order Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _raise_http_error(resp, default_status: int = 502):
    detail = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text
    raise HTTPException(status_code=resp.status_code or default_status, detail=detail)


def _get_customer(customer_id: str):
    resp = request_with_cb("customer", SERVICE_URLS["customer"], "get", f"/customers/{customer_id}")
    if resp.status_code != 200:
        _raise_http_error(resp, 404)
    return resp.json()


def _validate_token(auth_header: str) -> str:
    resp = request_with_cb("auth", SERVICE_URLS["auth"], "get", "/auth/validate", headers={"Authorization": auth_header})
    if resp.status_code != 200:
        _raise_http_error(resp, 401)
    return str(resp.json().get("customer_id"))


def _get_product(product_id: int):
    resp = request_with_cb("product", SERVICE_URLS["product"], "get", f"/products/{product_id}")
    if resp.status_code != 200:
        _raise_http_error(resp, 404)
    return resp.json()


def _check_stock(product_id: int, quantity: int):
    resp = request_with_cb(
        "product",
        SERVICE_URLS["product"],
        "get",
        f"/products/{product_id}/stock",
        params={"quantity": quantity},
    )
    if resp.status_code != 200:
        _raise_http_error(resp, 404)
    data = resp.json()
    if not data.get("available"):
        raise HTTPException(
            status_code=400,
            detail=f"Product {product_id} insufficient stock. Available: {data.get('current_stock', 0)}"
        )


def _update_stock(product_id: int, quantity: int):
    resp = request_with_cb(
        "product",
        SERVICE_URLS["product"],
        "put",
        f"/products/{product_id}/stock",
        json={"quantity": quantity},
    )
    if resp.status_code != 200:
        _raise_http_error(resp, 400)
    return resp.json()


def _create_order(customer_id: str, items: List[OrderItem], note: str | None, payment_method: str, products_info: dict):
    # Add price and product_name to items (data duplication for microservices)
    items_with_price = []
    for item in items:
        product = products_info.get(item.product_id)
        items_with_price.append({
            "product_id": item.product_id,
            "product_name": product["name"] if product else f"Product {item.product_id}",
            "quantity": item.quantity,
            "price": product["price"] if product else 0
        })
    
    payload = {
        "customer_id": customer_id,
        "items": items_with_price,
        "note": note,
        "payment_method": payment_method,
    }
    resp = request_with_cb("order", SERVICE_URLS["order"], "post", "/orders", json=payload)
    if resp.status_code not in (200, 201):
        _raise_http_error(resp, 400)
    return resp.json()


def _send_notification(to_email: str, order_id: int, customer_id: str):
    """
    Send notification via RabbitMQ event (async)
    Fallback to HTTP if event publishing fails
    """
    from common.event_publisher import publish_event
    
    try:
        # Publish event to RabbitMQ (async, non-blocking)
        publish_event("order.created", {
            "order_id": order_id,
            "customer_email": to_email,
            "customer_id": customer_id
        })
    except Exception as e:
        # Fallback to HTTP if RabbitMQ fails
        body = {
            "to": to_email,
            "subject": f"Order #{order_id} confirmation",
            "content": f"Your order #{order_id} has been placed successfully.",
        }
        resp = request_with_cb("notification", SERVICE_URLS["notification"], "post", "/notifications/email", json=body)
        if resp.status_code != 200:
            _raise_http_error(resp, 502)


def _extract_auth_header(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    return authorization


def _clear_cart(customer_id: str):
    request_with_cb("cart", SERVICE_URLS["cart"], "delete", f"/customers/{customer_id}/cart")


def _process_payment(method: str):
    if method.lower() == "online":
        # Stub: giả lập thanh toán thành công
        return True
    return True  # COD or others treated as success


@app.post("/ordering")
def ordering(request: OrderingRequest, authorization: str | None = Header(default=None)):
    auth_header = _extract_auth_header(authorization)

    # 1) Validate token
    validated_customer_id = _validate_token(auth_header)
    if validated_customer_id and validated_customer_id != request.customer_id:
        raise HTTPException(status_code=401, detail="Customer mismatch with token")

    # 2) Fetch customer info
    customer = _get_customer(request.customer_id)

    # 3) Get product info and check stock for each item
    products_info = {}
    for item in request.items:
        product = _get_product(item.product_id)
        products_info[item.product_id] = product
        _check_stock(item.product_id, item.quantity)

    # 4) Update stock
    for item in request.items:
        _update_stock(item.product_id, item.quantity)

    # 5) Create order
    order = _create_order(request.customer_id, request.items, request.note, request.payment_method, products_info)

    # 6) Send notification (async via RabbitMQ)
    _send_notification(customer.get("email", ""), order.get("id"), request.customer_id)

    # 7) Clear cart
    _clear_cart(request.customer_id)

    # 8) Process payment (stub)
    if not _process_payment(request.payment_method):
        raise HTTPException(status_code=400, detail="Payment failed")

    return {"status": "success", "order": order}


@app.get("/health")
def health():
    return {"status": "ok"}
