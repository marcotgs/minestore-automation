import { productsMocks } from '@db/product/__mocks__/products.mock';
import { mockSession } from '../auth/__mocks__/minestore-auth.mock';
import { MinestoreStock } from './minestore-stock';

describe('MinestoreStock', () => {
	const t = new MinestoreStock(mockSession, productsMocks[0]);
	test('should ', () => {});
});
