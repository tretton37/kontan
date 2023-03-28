#!/usr/bin/env bash

echo "Pulling latest from "$(git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/')" branch"
git pull

npm install
npm run build

# Generate start scripts
echo "export PATH="$(npm config get prefix)"/bin/node:$PATH" > startProd.sh
echo "npm run serve:prod" >> startProd.sh

sudo supervisorctl restart kontan