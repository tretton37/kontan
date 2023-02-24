import paho.mqtt.client as mqtt
import requests

def postUserCheck(client, uid):
	uid = uid.strip(":")

	payload = {
		"tag":uid
	}

	r = requests.post("https://europe-west1-kontan-22694.cloudfunctions.net/checkUser", data=payload)

	if r.status_code == 201:
		client.publish("/user/inbound")
	elif r.status_code == 409:
		client.publish("/user/outbound")

onUserCheckHandler = {
	"topic": "/user/check",
	"onMessage": postUserCheck,
	"qos": 0
}

def bind_on_connect(handlers):
    # The callback for when the client receives a CONNACK response from the server.
    def on_connect(client, userdata, flags, rc):
        print("Connected with result code "+str(rc))
        for handler in handlers:
            client.subscribe(handler["topic"], qos=handler["qos"])

    return on_connect

def bind_on_message(handlers):
	# The callback for when a PUBLISH message is received from the server.
	def on_message(client, userdata, msg):
		for handler in handlers:
			if handler["topic"] == msg.topic:
				payload = msg.payload.decode("utf-8")
				handler["onMessage"](client, str(payload))

	return on_message

def main():
	handlers = [onUserCheckHandler]

	client = mqtt.Client()
	client.on_connect = bind_on_connect(handlers)
	client.on_message = bind_on_message(handlers)
	client.connect("localhost", 1883, 60)

	# Blocking call that processes network traffic, dispatches callbacks and
	# handles reconnecting.
	# Other loop*() functions are available that give a threaded interface and a
	# manual interface.
	client.loop_forever()

if __name__ == "__main__":
	main()