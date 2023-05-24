#include "SPI.h"
#include <TFT_eSPI.h> // Hardware-specific library
#include <WiFi.h>
#include "vars.h"
#include <PubSubClient.h>

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
TFT_eSPI tft = TFT_eSPI(); // Invoke custom library

#define POT_PIN 33
#define BTN_PIN 26

char previousDisplayValue[100];

//====================================================================================
//                                    Setup
//====================================================================================
void setup()
{
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASS); // replace with correct value

  Serial.println("establishing wifi connection: ");

  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print('.');
    delay(1000);
  }

  Serial.println(WiFi.localIP());

  pinMode(BTN_PIN, INPUT);
  tft.init();
  tft.setRotation(1);
  // Initialise the TFT
  tft.begin();
  tft.fillScreen(TFT_BLACK);

  mqttClient.setServer(MQTT_IP, 1883);
  connectToMqtt();
}

char events[3][1024] = {
    "FIKA",
    "LUNCH",
    "BREAKFAST"};

//====================================================================================
//                                    Loop
//====================================================================================
void loop()
{
  if(!mqttClient.connected()) {
    connectToMqtt();
  }
  mqttClient.loop();
  int potentiometerValue = analogRead(POT_PIN);
  int btnValue = digitalRead(BTN_PIN);

  int mappedValue = map(potentiometerValue, 0, 4095, 2, 0);

  print(mappedValue);

  if(btnValue == 1) {
    publishMessage(mappedValue);
  }
}

void print(int value)
{
  char *str = events[value];
  if (strcmp(previousDisplayValue, str) == 0)
  {
    return;
  }

  tft.fillScreen(TFT_BLACK);
  tft.setCursor(0, 0, 2);
  tft.setTextColor(TFT_BLUE, TFT_BLACK);
  tft.setTextFont(2);
  for (int i = 0; i < 3; i++)
  {
    char *outValue = events[i];
    if (str == outValue)
    {
      tft.setTextColor(TFT_GREEN, TFT_BLACK);
      tft.print("- ");
    }
    else
    {
      tft.print("  ");
    }
    tft.print(outValue);
    tft.println("");
    tft.setTextColor(TFT_BLUE, TFT_BLACK);
  }

  strcpy(previousDisplayValue, str);
}

bool connectToMqtt()
{
  while (!mqttClient.connected())
  {
    Serial.println("Attempting MQTT connection...");
    String clientId = "EVENT_NOTIFIER";
    clientId += String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str(), "user", "pass"))
    {
      return true;
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
      return false;
    }
  }
  return true;
}

void publishMessage(int value) {
  char* str = events[value];

  mqttClient.publish("/eventnotify", str);
  tft.fillScreen(TFT_BLACK);
  tft.setCursor(0, 0, 2);
  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.setTextFont(2);
  tft.println("Notification sent!");
  strcpy(previousDisplayValue, "Notification sent!");
  delay(5000);
}