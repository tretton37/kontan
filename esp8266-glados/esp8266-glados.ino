#include <ESP8266WiFi.h>
#include "config.h"
#include <PubSubClient.h>
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include "SerialMP3Player.h"

// Rx should connect to TX of the Serial MP3 Player module
#define ESP8266_RX D5
// Tx connect to RX of the module
#define ESP8266_TX D6

SerialMP3Player mp3(ESP8266_RX,ESP8266_TX);

int inboundSounds[] = {8, 3, 9, 6};
int outboundSounds[] = {2, 5, 12, 13};
int rfidUnknownSounds[] = {1};
long soundIndex;


WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

void setup() {
  Serial.begin(9600);
  Serial.println();

  connectToWifi(ssid, wifiPassword);
  mqttClient.setServer(mqttHostname, mqttPort);

  randomSeed(analogRead(5));
  
  mp3.begin(9600);        // start mp3-communication
  delay(500);             // wait for init
  mp3.sendCommand(CMD_SEL_DEV, 0, 2);   //select sd-card
  delay(500);             // wait for init

  ArduinoOTA.setHostname(otaHostname);
  ArduinoOTA.setPassword(otaPassword);

  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
    } else {  // U_FS
      type = "filesystem";
    }

    // NOTE: if updating FS this would be the place to unmount FS using FS.end()
    Serial.println("Start updating " + type);
  });

  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });

  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) {
      Serial.println("Auth Failed");
    } else if (error == OTA_BEGIN_ERROR) {
      Serial.println("Begin Failed");
    } else if (error == OTA_CONNECT_ERROR) {
      Serial.println("Connect Failed");
    } else if (error == OTA_RECEIVE_ERROR) {
      Serial.println("Receive Failed");
    } else if (error == OTA_END_ERROR) {
      Serial.println("End Failed");
    }
  });

  ArduinoOTA.begin();
}

void loop() {
  if (!mqttClient.connected()) {
    connectToMqtt();
  }

  ArduinoOTA.handle();
  mqttClient.loop();
}

void connectToWifi(char ssid[], char password[]) {
  Serial.println("Attempting WiFI connection...");
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Connected");
}

void callback(char topic[], byte *payload, unsigned int length) {
  Serial.println(topic);

  if(strcmp(topic, inboundTopic) == 0 ) {
    playRandomSound(inboundSounds, sizeof(inboundSounds) / sizeof(inboundSounds[0]));
    return;
  } 
  else if (strcmp(topic, outboundTopic) == 0) {
    playRandomSound(outboundSounds, sizeof(outboundSounds) / sizeof(outboundSounds[0]));
    return;
  }
  else if (strcmp(topic, rfidUnknownTopic) == 0) {
    playRandomSound(rfidUnknownSounds, sizeof(rfidUnknownSounds) / sizeof(rfidUnknownSounds[0]));
    return;
  }
}

void playRandomSound(int sounds[], int length) {
  soundIndex = random(0, length);

  mp3.play(sounds[soundIndex], 30);
}

void connectToMqtt() {
  while (!mqttClient.connected()) {
    Serial.println("Attempting MQTT connection...");

    if (mqttClient.connect(mqttClientName)) {
      Serial.println("connected");

      mqttClient.setCallback(callback);
      mqttClient.subscribe("#");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");

      delay(5000);
    }
  }
}
