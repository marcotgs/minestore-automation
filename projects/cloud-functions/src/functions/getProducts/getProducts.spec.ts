import { Request, logger } from 'firebase-functions';
import { Product, productRepository } from '@db/product';
import { ProductsTopic } from '@core/pubsub/products-topic';
import { getProducts, getProductsOnce } from './getProducts';
import { minestoreAuth } from '@core/minestore';
import { productsMocks } from '@db/product/__mocks__/products.mock';

jest.mock('@core/pubsub');
jest.mock('@core/minestore');

describe('functions:getProducts', () => {
	const publishSpy = jest.spyOn(ProductsTopic.prototype, 'publish');
	const req = { body: {} } as Request;
	const res: any = { json: jest.fn() };

	const mockProducts: Product[] = [productsMocks[0]];

	beforeAll(() => {
		minestoreAuth.login = jest.fn().mockReturnValue(Promise.resolve());
		productRepository.find = jest
			.fn<Promise<Product[]>, any[]>()
			.mockImplementation(() => Promise.resolve(mockProducts));
	});

	describe('getProducts', () => {
		test('should publish products to the topic from database', async () => {
			await getProducts({}, { timestamp: new Date().toISOString() });

			expect(productRepository.find).toBeCalled();
			expect(minestoreAuth.login).toBeCalled();
			expect(publishSpy).toBeCalled();
		});
	});

	describe('getProductsOnce', () => {
		test('should publish products to the topic', async () => {
			await getProductsOnce(req, res);

			expect(res.json).toBeCalledWith(mockProducts);
			expect(minestoreAuth.login).toBeCalled();
			expect(publishSpy).toBeCalled();
		});

		test('should log exception', async () => {
			logger.error = jest.fn();
			jest.spyOn(ProductsTopic.prototype, 'publish').mockResolvedValue(Promise.reject());

			try {
				await getProductsOnce(req, res);
			} catch {}

			expect(logger.error).toBeCalled();
		});
	});
});
