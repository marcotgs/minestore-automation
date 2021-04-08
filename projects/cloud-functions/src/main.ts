import admin from 'firebase-admin';
import { initFirestore } from './db/init';

admin.initializeApp();
initFirestore(admin);

export * from './getProducts';
