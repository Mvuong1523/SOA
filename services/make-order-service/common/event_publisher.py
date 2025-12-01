import os
import json
import pika
import logging

logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://admin:admin123@rabbitmq:5672/")


def publish_event(event_name: str, data: dict):
    """
    Publish event to RabbitMQ
    
    Args:
        event_name: Name of the event (e.g., "order.created")
        data: Event payload as dictionary
    """
    try:
        # Connect to RabbitMQ
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        
        # Declare queue (idempotent)
        channel.queue_declare(queue=event_name, durable=True)
        
        # Publish message
        channel.basic_publish(
            exchange='',
            routing_key=event_name,
            body=json.dumps(data),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
                content_type='application/json'
            )
        )
        
        logger.info(f"Published event '{event_name}': {data}")
        connection.close()
        
    except Exception as e:
        logger.error(f"Failed to publish event '{event_name}': {e}")
        # Don't raise - event publishing should not break the main flow
