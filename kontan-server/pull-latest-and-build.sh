#!/usr/bin/env bash

echo "Pulling latest from "$(git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/')" branch"
git pull

npm install
npm run build

# Generate start scripts
echo "export PATH="$(npm config get prefix)"/bin/node:$PATH" > startProd.sh
{ echo "cd "$(pwd)""; echo "sudo killall node"; echo "npm run serve:prod"; } >> startProd.sh
echo "ngrok http --subdomain=kontan localhost:3000 --log=stdout > ngrok.prod.log &" > startProd.tunnel.sh

sudo supervisorctl restart kontan