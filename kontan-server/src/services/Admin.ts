import { Injectable, Scope } from '@nestjs/common';
import { initializeApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable({ scope: Scope.DEFAULT })
export class Admin {
  private app: App;
  public readonly db = () => getFirestore(this.app);
  constructor() {
    const path =
      process.env.NODE_ENV === 'production'
        ? '../../serviceAccount.json'
        : '../../serviceAccount.dev.json';
    import(path).then((account) => {
      this.app = initializeApp({ credential: cert(account as ServiceAccount) });
    });
  }
}
