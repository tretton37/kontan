#!/usr/bin/env bash

echo "Pulling latest from "$(git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/')" branch"
git pull

npm install
npm run build

# Generate start scripts
echo "export PATH="$(npm config get prefix)"/bin/node:$PATH" > startProd.sh
{ echo "cd "$(pwd)""; echo "npm run serve:prod"; } >> startProd.sh
echo "sudo killall ngrok" > startProd.tunnel.sh
echo "ngrok http --config=$HOME/.config/ngrok/ngrok.yml --subdomain=kontan localhost:3000 --log=stdout > /var/log/ngrok.prod.log" >> startProd.tunnel.sh

sudo supervisorctl restart kontan:*