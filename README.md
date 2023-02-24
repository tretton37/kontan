# Kontan

## MQTT
### Connecting to the Raspberry Pi
```bash
ssh rpi@RASPBERRYPI_IP
```

Enter password when prompted.

### Supervisor
The mqtt-watcher/main.py script is running as a monitored process by [Supervisor](http://supervisord.org/).

To list the processes currently running by Supervisor run 
```bash
sudo supervisorctl status all
```

To restart the mqtt-watcher python script run
```bash
sudo supervisorctl restart mqtt-watcher
```

The Supervisor config for the mqtt-watcher is located under `/etc/supervisor/conf.d/mqtt-watcher.conf`.

The mqtt-watcher python files are located under `/home/rpi/code/kontan/mqtt-watcher`

### Mqtt broker
[Mosquitto](https://mosquitto.org/man/mosquitto-8.html) is the mqtt broker running on the Raspberry Pi.