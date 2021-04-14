import { initializeApp } from 'firebase-admin';
import { initFirestore } from '@db/init';
import { init } from './main';

jest.mock('firebase-admin', () => ({
	initializeApp: jest.fn(),
}));

jest.mock('@db/init', () => ({
	initFirestore: jest.fn(),
}));

describe('main', () => {
	test('should initialize the app', () => {
		init();

		expect(initFirestore).toBeCalled();
		expect(initializeApp).toBeCalled();
	});
});
