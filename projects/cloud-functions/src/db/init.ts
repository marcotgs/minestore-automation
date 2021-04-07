import * as admin from 'firebase-admin';
import * as fireorm from 'fireorm';

export const initFirestore = (): void => {
	admin.initializeApp();
	const firestore = admin.firestore();
	fireorm.initialize(firestore);
};
