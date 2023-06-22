#!/usr/bin/env ts-node-script

import { initializeApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;
const db = () => getFirestore(app);

async function init() {
  const path =
    process.argv[3] === 'production'
      ? '../../serviceAccount.json'
      : '../../serviceAccount.dev.json';
  await import(path).then((account) => {
    app = initializeApp({ credential: cert(account as ServiceAccount) });
  });
}

async function addCheckIn() {
  await init();
  const document = await db().collection('presence').doc('checkIn_Lund').get();
  if (!document || !document.exists) {
    await document.ref.set({ offices: {} });
  }
}

addCheckIn();
