import os
import json
import pika
import logging
from threading import Thread

logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://admin:admin123@rabbitmq:5672/")


def start_consumer():
    """Start RabbitMQ consumer in background thread"""
    thread = Thread(target=consume_events, daemon=True)
    thread.start()
    logger.info("Event consumer started in background")


def consume_events():
    """
    Consume events from RabbitMQ
    Subscribe to order.created events
    """
    try:
        # Connect to RabbitMQ
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        
        # Declare queue
        channel.queue_declare(queue='order.created', durable=True)
        
        # Set up consumer
        def callback(ch, method, properties, body):
            try:
                event_data = json.loads(body)
                logger.info(f"Received order.created event: {event_data}")
                
                # Process event - send notification
                send_notification(event_data)
                
                # Acknowledge message
                ch.basic_ack(delivery_tag=method.delivery_tag)
                
            except Exception as e:
                logger.error(f"Error processing event: {e}")
                # Reject and requeue message
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        
        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue='order.created', on_message_callback=callback)
        
        logger.info("Waiting for order.created events...")
        channel.start_consuming()
        
    except Exception as e:
        logger.error(f"Consumer error: {e}")


def send_notification(event_data: dict):
    """
    Send notification based on event data
    
    Args:
        event_data: {
            "order_id": 123,
            "customer_email": "user@example.com",
            "customer_id": "12345"
        }
    """
    order_id = event_data.get("order_id")
    email = event_data.get("customer_email")
    
    logger.info(f"📧 Sending email to {email} for order #{order_id}")
    logger.info(f"✅ Email sent successfully (stub)")
    
    # In production, integrate with real email service:
    # - SendGrid
    # - AWS SES
    # - Mailgun
    # etc.
