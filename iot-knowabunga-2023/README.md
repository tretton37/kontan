# IoT Knowabunga 2023
## Projects

### ESP32 tutorial
This folder contains all the information needed in order to get started with ESP32 development. The tutorial will take you through all the steps from setting up a project in PlatformIO to connecting the ESP32 to a WiFi and publish MQTT messages, including wiring some hardware. [Get started here](esp32-tutorial/1.init.md)

### Personalized greetings and farewells (Python text-to-speech)
The text-to-speech-boilerplate folder contains the Python code needed to get started to build a custom office greeter. Think of it as [HAL 9000](https://en.wikipedia.org/wiki/HAL_9000) from the movie 2001: A Space Odyssey or [GLaDOS](https://en.wikipedia.org/wiki/GLaDOS) from the Portal games.

### General notifier
We would want a general notifier, that sends out a message to everyone that's currently checked in at the office.
Use a potentiometer to switch between different notifications, like fika, lunch train leaving or breakfast etc.
Please use pretty bitmaps!

### Other project ideas
Apart from the ones covered in the ESP32 tutorial there's also a limited number of extra components which you could try connecting to you ESP32. They are listed below together with some documentation and tutorials.

#### ESP32 Webserver
Create an ESP32 powered webserver: https://electropeak.com/learn/create-a-web-server-w-esp32/

#### HC-SR501 PIR motion detection sensor
[Tutorial and documentation](https://lastminuteengineers.com/pir-sensor-arduino-tutorial/)

#### KY-015 DHT 11 temperature and humidity sensor
[Documentation](https://cdn.shopify.com/s/files/1/1509/1638/files/DHT_11_Temperatursensor_Modul_Datenblatt_a59ef62a-ee56-4c72-918f-00cb97f71f64.pdf?16953870400002276923)

[Tutorial](https://www.upesy.com/blogs/tutorials/dht11-humidity-temperature-sensor-with-arduino-code-on-esp32-board)

#### HC-SR04 - Ultrasonic Distance Sensor
[Documentation and tutorial](https://randomnerdtutorials.com/esp32-hc-sr04-ultrasonic-arduino/)

#### MG90S servo
WARNING: Do not connect the servo to the 3.3v pin on the ESP32, use the 5V/Vin pin.
[Tutorial](https://randomnerdtutorials.com/esp32-servo-motor-web-server-arduino-ide/)

#### PS2 Joystick shield
[Documentation](https://cdn.shopify.com/s/files/1/1509/1638/files/JoyStick_KY-023_Keypad_Gamepad_Shield_PS2_Datenblatt.pdf?6230133417886963906)
