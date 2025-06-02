from dotenv import load_dotenv
import os
import pika
import time
import json

load_dotenv()


id = os.environ.get("ID")
print(f"Loaded ID from env: worker-{id}")

# RabbitMQ connection params
rabbitmq_host = os.environ.get("RABBITMQ_HOST")
rabbitmq_user = os.environ.get("RABBITMQ_USER")
rabbitmq_pass = os.environ.get("RABBITMQ_PASS")
rabbitmq_queue = os.environ.get("RABBITMQ_QUEUE")
response_queue = os.environ.get("RESPONSE_QUEUE")

# Check for missing parameters and exit with error
missing_params = []
for name, value in [
    ("RABBITMQ_HOST", rabbitmq_host),
    ("RABBITMQ_USER", rabbitmq_user),
    ("RABBITMQ_PASS", rabbitmq_pass),
    ("RABBITMQ_QUEUE", rabbitmq_queue),
    ("RESPONSE_QUEUE", response_queue),
]:
    if not value:
        missing_params.append(name)
if missing_params:
    print(f"ERROR: Missing RabbitMQ config values: {', '.join(missing_params)}")
    exit(1)


# Code that might raise an exception
# ...
credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
parameters = pika.ConnectionParameters(host=rabbitmq_host, credentials=credentials)

# Wait for RabbitMQ to be available before connecting
connection = None
while connection is None:
    try:
        connection = pika.BlockingConnection(parameters)
    except pika.exceptions.AMQPConnectionError:
        print("Waiting for RabbitMQ to be available...")
        time.sleep(2)

channel = connection.channel()
channel.queue_declare(queue=rabbitmq_queue, durable=True)
channe2 = connection.channel()
channe2.queue_declare(queue=response_queue, durable=True)

print("Connected RabbitMQ ...")

def callback(ch, method, properties, body):
    print(f"[RabbitMQ] Received message: {body.decode()}")
    # Manually acknowledge the message
    # ch.basic_ack(delivery_tag=method.delivery_tag)

    buf = json.loads(body.decode())
    data = json.loads(bytes(buf["data"]).decode('utf-8'))
    data["ID"] = id
    print(f"[RabbitMQ] Received message: {data}")


    # data["ID"] = id
    json_data = json.dumps(data)
    print(" [x] Sent JSON data:", json_data)
    
    channe2.basic_publish(
        exchange='',
        routing_key=response_queue,
        body=json_data,
        properties=pika.BasicProperties(
            delivery_mode=2,  # Make the message persistent
        )
    )

    # logging.info(" [x] Sent JSON data:", json_data)

channel.basic_consume(queue=rabbitmq_queue, on_message_callback=callback, auto_ack=True)
print(f"Waiting for messages from RabbitMQ queue '{rabbitmq_queue}'. To exit press CTRL+C.")
try:
    channel.start_consuming()
except KeyboardInterrupt:
    print("Exiting RabbitMQ consumer.")
finally:
    connection.close()
