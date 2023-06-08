<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

# Installation

```bash
$ npm install
```

## "Deploying" the app to your IoT device 

You want to make sure you have supervisor installed.

Create a `.conf` file in `/etc/supervisor/conf.d/` and add the following:

```
[program:kontan-server]
command=/bin/bash /fullPathToRepo/kontan-server/startProd.sh
autostart=true
autorestart=true
stderr_logfile=/var/log/prod.err.log
stdout_logfile=/var/log/prod.out.log

[program:kontan-tunnel]
command=/bin/bash /fullPathToRepo/kontan-server/startProd.tunnel.sh
autostart=true
autorestart=true
stderr_logfile=/var/log/prod.tunnel.err.log
stdout_logfile=/var/log/prod.tunnel.out.log
stopsignal=QUIT

[group:kontan]
programs=kontan-server,kontan-tunnel
priority=999

[program:kontan-dev-server]
command=/bin/bash /fullPathToRepo/kontan-server/startDev.sh
autostart=true
autorestart=true
stderr_logfile=/var/log/dev.err.log
stdout_logfile=/var/log/dev.out.log

[program:kontan-dev-tunnel]
command=/bin/bash /fullPathToRepo/kontan-server/startDev.tunnel.sh
autostart=true//
autorestart=true
stderr_logfile=/var/log/dev.tunnel.err.log
stdout_logfile=/var/log/dev.tunnel.out.log

[group:kontan-dev]
programs=kontan-dev-server,kontan-dev-tunnel
priority=998

```

Then run `sudo supervisorctl reread` and `sudo supervisorctl update` to update the supervisor config.

### Getting the latest code on your device

Connect to the Node.js server by SSH `ssh kontan@10.11.15.95` and change dir to kontan/kontan-server. Run the `pull-latest-and-build.sh` script to pull the latest code and restart the kontan service. This script will also generate the start[env].sh scripts. Verify that everything is ok by running `sudo supervisorctl status`. Ignore the status `kontan:kontan-tunnel FATAL Exited too quickly (process log may have details)`.

If the slack app is down you probably need to restart the ngrok tunnel. Run `sudo killall ngrok` and `sudo bash startProd.tunnel.sh`

## Service Account 
Go to firebase > Project settings > Service accounts > Generate new private key > Save the file as serviceAccount.json and serviceAccount.dev.json from the dev project
