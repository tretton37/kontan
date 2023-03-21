import { Injectable, Scope } from '@nestjs/common';
import { initializeApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable({ scope: Scope.DEFAULT })
export class Admin {
  private app: App;
  public readonly db = () => getFirestore(this.app);
  constructor() {
    import('../../serviceAccount.json').then((account) => {
      this.app = initializeApp({ credential: cert(account as ServiceAccount) });
    });
  }
}
