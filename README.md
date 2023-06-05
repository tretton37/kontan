# Kontan

This is the repo of Kontan, a product originally developed in our Helsingborg office. 

It provides us ability to plan our work week via a slack bot integration, along with a couple of IoT devices to make fun integrations. 

## RFID

RFID is an nfc-tag reader which we use to check in to the office, that way we can determine who's actually physically present in the office - this acts as a baseline and prerequisite for other integrations. 

## text-to-speech

A module that runs on a rPi and will greet you when you check in and say goodbye when you go home for the day. 

## Even notifier

A general event notifier to send out slack notifications to everyone present in the office. Mostly used for when there's FIKA 

## Server

The BE service of it all. 
It's running as an on prem node.js server, it's also the broker for all MQTT messages.

## MQTT
### Connecting to the Raspberry Pi
```bash
ssh kontan@RASPBERRYPI_IP
```

Enter password when prompted.

## Improvements (IoT devices)

### General notifier
We would want a general notifier, that sends out a message to everyone that's currently checked in at the office.
Use a potentiometer to switch between different notifications, like fika, lunch train leaving or breakfast etc.
Please use pretty bitmaps!