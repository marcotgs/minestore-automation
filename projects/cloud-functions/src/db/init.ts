import { app } from 'firebase-admin';
import * as fireorm from 'fireorm';

export const initFirestore = (adminApp: app.App): void => {
	const firestore = adminApp.firestore();
	fireorm.initialize(firestore);
};
