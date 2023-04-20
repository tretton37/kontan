/* Read RFID Tag with RC522 RFID Reader
 *  Made by miliohm.com
 */

#include <SPI.h>
#include <MFRC522.h>

#include <ESP8266WiFi.h>
#include <PubSubClient.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "secrets.h"
#include "bitmaps.h"

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels

#define OLED_RESET -1 // Reset pin # (or -1 if sharing Arduino reset pin)
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define LOGO_HEIGHT 16
#define LOGO_WIDTH 16

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

constexpr uint8_t RST_PIN = D3; // Configurable, see typical pin layout above
constexpr uint8_t SS_PIN = D4;  // Configurable, see typical pin layout above

MFRC522 mfrc522(SS_PIN, RST_PIN); // Instance of the class
MFRC522::MIFARE_Key key;

char ssid[] = SECRET_SSID;
char pass[] = SECRET_WIFI_PASS;

bool connectToWifi(char ssid[], char password[])
{
  WiFi.begin(ssid, password);

  Serial.println("Connecting");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  Serial.print("Connected to " + String(ssid) + " Wifi");

  Serial.println();
  return true;
}

void beginDisp()
{
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
  { // Address 0x3C for 128x32
    Serial.println(F("SSD1306 allocation failed"));
  }
  display.setTextSize(2);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.clearDisplay();
}

void status(String status, bool clear = false, int size = 2, int delayTime = 2000)
{
  if (clear)
  {
    beginDisp();
  }
  display.setTextSize(size);
  display.println(status);
  display.display();
  delay(delayTime);
}

void idle(void)
{
  beginDisp();
  display.println();
  display.println("RFID");
  display.println("@kontan");
  display.println();
  display.startscrollleft(0x00, 0x0F);
  display.display();
}

void greet(void)
{
  beginDisp();

  display.drawBitmap(0, 0, CheckmarkBitmap, 128, 64, WHITE);
  display.display();

  delay(2000);
  idle();
}

void goodbye(void)
{
  beginDisp();

  display.drawBitmap(0, 0, ExitBitmap, 128, 64, WHITE);
  display.display();
  delay(2000);
  idle();
}

void newuser(byte *payload, unsigned int length)
{
  String tag = "";
  for (int i = 0; i < length; i++) {
    tag += (char)payload[i];
  }
  Serial.println(tag);
  beginDisp();

  display.println();
  display.println(tag);
  display.display();
  delay(30000);
  idle();
}

bool isLoading = false;
int loadingTries = 0;

void callback(char *topic, byte *payload, unsigned int length)
{
  Serial.println("Message arrived");
  if (String(topic) == "/rfid/inbound")
  {
    greet();
  }
  if (String(topic) == "/rfid/outbound")
  {
    goodbye();
  }
  if (String(topic) == "/rfid/unknown")
  {
    newuser(payload, length);
  }
  isLoading = false;
  loadingTries = 0;
}

bool connectToMqtt()
{
  while (!mqttClient.connected())
  {
    Serial.println("Attempting MQTT connection...");
    String clientId = "rfid@kontan-";
    clientId += String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str(), "user", "pass"))
    {
      Serial.println("connected with clientId: " + clientId);
      mqttClient.subscribe("/rfid/inbound");
      mqttClient.subscribe("/rfid/outbound");
      mqttClient.subscribe("/rfid/unknown");
      mqttClient.setCallback(callback);
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

void setup()
{
  Serial.begin(9600); // Initialize serial communications with the PC
  status("wifi", true, 2, 0);
  bool wifiSuccess = connectToWifi(ssid, pass);
  if (wifiSuccess)
  {
    status("connected " + String(ssid), false, 2, 2000);
  }
  mqttClient.setServer("10.11.15.95", 1883);
  while (!Serial)
    ;                                // Do nothing if no serial port is opened (added for Arduinos based on ATMEGA32U4)
  SPI.begin();                       // Init SPI bus
  mfrc522.PCD_Init();                // Init MFRC522
  delay(4);                          // Optional delay. Some board do need more time after init to be ready, see Readme
  mfrc522.PCD_DumpVersionToSerial(); // Show details of PCD - MFRC522 Card Reader details
  Serial.println();

  status("mqtt", true, 2, 0);
  bool mqttSuccess = connectToMqtt();
  if (mqttSuccess)
  {
    status("connected", false, 2, 2000);
    mqttClient.setCallback(callback);
  }

  idle();
}

void loading(void)
{
  beginDisp();
  int count = 0;
  while (count < 8)
  {
    display.clearDisplay();
    display.drawBitmap(0, 0, LoadingBitmap[count], 128, 64, WHITE);
    display.display();
    count++;
    delay(200);
  }
}

void error(void)
{
  beginDisp();
  display.println("Error");
  display.display();
  delay(2000);
  idle();
}

void loop()
{
  if (!mqttClient.connected())
  {
    connectToMqtt();
  }

  mqttClient.loop();

  if (isLoading && loadingTries < 5)
  {
    loading();
    loadingTries++;
    return;
  }
  else if (isLoading && loadingTries >= 5)
  {
    loadingTries = 0;
    isLoading = false;
    error();
  }

  // Reset the loop if no new card present on the sensor/reader. This saves the entire process when idle.
  if (!mfrc522.PICC_IsNewCardPresent())
  {
    return;
  }

  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial())
  {
    byte bufferATQA[2];
    byte bufferSize = sizeof(bufferATQA);
    mfrc522.PICC_WakeupA(bufferATQA, &bufferSize);
    if (!mfrc522.PICC_ReadCardSerial())
    {
      return;
    }
  }

  MFRC522::Uid *uid = &(mfrc522.uid);
  String tag = "";

  for (byte i = 0; i < uid->size; i++)
  {
    if (uid->uidByte[i] < 0x10)
    {
      tag += F(":0");
    }
    else
    {
      tag += F(":");
    }
    tag += String(uid->uidByte[i], HEX);
  }
  Serial.println(F("TAG") + tag);

  mqttClient.publish("/rfid/check", tag.c_str());
  isLoading = true;

  mfrc522.PICC_HaltA();
}