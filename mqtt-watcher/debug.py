import os
import paho.mqtt.client as mqtt


# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))
    client.subscribe("#", qos=0)

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    payload = msg.payload.decode("utf-8")

    print(f'topic: {msg.topic}, message: {payload}')

def main():
	mqtt_hostname = os.environ.get("MQTT_HOSTNAME", "10.11.15.106")
	mqtt_port = int(os.environ.get("MQTT_PORT", "1883"))

	client = mqtt.Client()
	client.on_connect = on_connect
	client.on_message = on_message
	client.connect(mqtt_hostname, mqtt_port)

	# Blocking call that processes network traffic, dispatches callbacks and
	# handles reconnecting.
	# Other loop*() functions are available that give a threaded interface and a
	# manual interface.
	client.loop_forever()

if __name__ == "__main__":
	main()
