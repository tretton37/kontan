#include "SPI.h"
#include <TFT_eSPI.h> // Hardware-specific library
#include <WiFi.h>
#include "vars.h"
#include "util.h"
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

void printScreen(int value, int seed = 0)
{
  char *str = events[value];
  if (strcmp(previousDisplayValue, str) == 0)
  {
    return;
  }
  tft.setTextDatum(ML_DATUM); // middle left
  int X_POS = 50;
  int Y_POS = 44;
  for (int i = 0; i < 3; i++)
  {
    char *outValue = events[i];
    int multiplier = (i * 15);
    if (str == outValue)
    {
      tft.setTextColor(TFT_GREEN, TFT_BLACK);
      tft.drawSpot(X_POS - 10, Y_POS + multiplier, 4, TFT_GREEN);
    }
    else
    {
      tft.setTextColor(TFT_BLUE, TFT_BLACK);
      tft.drawSpot(X_POS - 10, Y_POS + multiplier, 4, TFT_BLACK);
    }
    tft.drawString(String(outValue), X_POS, Y_POS + multiplier, 2);
  }

  strcpy(previousDisplayValue, str);
}

int seed = 0;
void incrementSeed()
{
  if (seed < 5)
  {
    seed++;
  }
  else
  {
    seed = 0;
  }
}

void printBg(int seed = 0)
{
  int padding = 5;
  uint16_t colorCp[6] = {};
  for (int i = 0; i < 6; i++)
  {
    colorCp[i] = colors[i];
  }
  shiftLeftByN(colorCp, 6, seed);
  for (int i = 0; i < 6; i++)
  {
    int multiplier = i * 5;
    tft.drawSmoothRoundRect(
        0 + multiplier,                          // x
        0 + multiplier,                          // y
        4,                                       // r
        2,                                       // ir
        TFT_HEIGHT - padding - (multiplier * 2), // w
        TFT_WIDTH - padding - (multiplier * 2),  // h
        colorCp[i],
        TFT_BLACK);
  }
}


//====================================================================================
//                                    Loop
//====================================================================================
void loop()
{
  if (!mqttClient.connected())
  {
    connectToMqtt();
  }
  mqttClient.loop();
  int potentiometerValue = analogRead(POT_PIN);
  int btnValue = digitalRead(BTN_PIN);

  int mappedValue = map(potentiometerValue, 0, 4095, 2, 0);

printBg(seed);
  printScreen(mappedValue);

  if (btnValue == 1)
  {
    publishMessage(mappedValue);
  }
  incrementSeed();
  delay(250);
}

//====================================================================================
//                                    MQTT
//====================================================================================

bool connectToMqtt()
{
  while (!mqttClient.connected())
  {
    Serial.println("Attempting MQTT connection...");
    String clientId = "EVENT_NOTIFIER";
    clientId += String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str(), "user", "pass"))
    {
      Serial.println("Connected to MQTT");
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

void publishMessage(int value)
{
  char *str = events[value];

  mqttClient.publish("/eventnotify", str);
  mqttClient.publish("/ttv", str);
  tft.fillScreen(TFT_BLACK);
  tft.setCursor(0, 0, 2);
  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.setTextFont(2);
  tft.setTextDatum(MC_DATUM); // middle center
  tft.drawString("Notification sent!", 80, 64);
  strcpy(previousDisplayValue, "Notification sent!");
  delay(10000);
  tft.fillScreen(TFT_BLACK);
}