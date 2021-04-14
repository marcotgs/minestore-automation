/* eslint-disable import/no-extraneous-dependencies */
import firebaseTest from 'firebase-functions-test';
import * as fireorm from 'fireorm';

const firebaseInstance = firebaseTest();
const mockFirestore: FirebaseFirestore.Firestore = {
	collection: jest.fn(),
	batch: jest.fn(),
	settings: jest.fn(),
	bulkWriter: jest.fn(),
	bundle: jest.fn(),
	collectionGroup: jest.fn(),
	doc: jest.fn(),
	getAll: jest.fn(),
	listCollections: jest.fn(),
	runTransaction: jest.fn(),
	terminate: jest.fn(),
};
fireorm.initialize(mockFirestore);

afterAll(() => {
	firebaseInstance.cleanup();
});
