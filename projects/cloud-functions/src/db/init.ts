import * as fireorm from 'fireorm';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const initFirestore = (admin: any): void => {
	const firestore = admin.firestore();
	fireorm.initialize(firestore);
};
