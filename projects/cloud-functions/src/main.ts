import { initializeApp } from 'firebase-admin';
import { initFirestore } from '@db/init';

export const init = (): void => {
	const app = initializeApp();
	initFirestore(app);
};

init();

export * from './functions';
