import { app } from 'firebase-admin';
import * as fireorm from 'fireorm';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const initFirestore = (adminApp: app.App): void => {
	const firestore = adminApp.firestore();
	fireorm.initialize(firestore);
};
