import { app } from 'firebase-admin';
import { initialize } from 'fireorm';
import { initFirestore } from './init';

jest.mock('fireorm', () => ({
	initialize: jest.fn(),
}));

describe('db - init', () => {
	test('should init firestore', () => {
		const adminApp: Partial<app.App> = {
			firestore: jest.fn(),
		};
		initFirestore(adminApp as any);

		expect(adminApp.firestore).toHaveBeenCalled();
		expect(initialize).toHaveBeenCalled();
	});
});
