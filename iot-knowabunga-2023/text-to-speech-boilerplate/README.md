# kontan-text-to-speech
This repository contains the basic code needed to subscribe to MQTT topics and perform text-to-speech operations.
By default it connects to the Kontan MQTT server but for testing purposes it's recommended to host your own by running a local instance of the [Mosquitto MQTT server](https://mosquitto.org/download/)

[Install Mosquitto broker on macOS](https://subscription.packtpub.com/book/application-development/9781787287815/1/ch01lvl1sec12/installing-a-mosquitto-broker-on-macos)


## Installation
`brew install python3`

`pip3 install -r requirements.txt`

## Running the code
`python3 main.py`

To override what mqtt server to connect to simply set the environment variable `MQTT_HOSTNAME`:

`MQTT_HOSTNAME=localhost python3 main.py`


To test it simply publish mqtt messages containing the username as a raw payload to the following topics:
```
/ttv/inbound
/ttv/outbound
```

## Dependencies
MQTT client - https://pypi.org/project/paho-mqtt/

Text-to-speech - https://pypi.org/project/pyttsx3/