import { Request, logger } from 'firebase-functions';
import { Product, productRepository } from '@db/products';
import { ProductsTopic } from '@pubsub/products';
import { getProducts, scheduledGetProducts } from './getProducts';
import { productsMocks } from '@db/__mocks__/products.mocks';

jest.mock('@pubsub/products');

describe('functions:getProducts', () => {
	const publishSpy = jest.spyOn(ProductsTopic.prototype, 'publish');
	const req = { body: {} } as Request;
	const res: any = { json: jest.fn() };

	const mockProducts: Product[] = productsMocks;

	beforeAll(() => {
		productRepository.find = jest
			.fn<Promise<Product[]>, any[]>()
			.mockImplementation(() => Promise.resolve(mockProducts));
	});

	describe('scheduledGetProducts', () => {
		test('should publish products to the topic from database', async () => {
			await scheduledGetProducts({}, { timestamp: new Date().toISOString() });

			expect(productRepository.find).toBeCalled();
			expect(publishSpy).toBeCalled();
		});
	});

	describe('getProducts', () => {
		test('should publish products to the topic', async () => {
			await getProducts(req, res);

			expect(res.json).toBeCalledWith(mockProducts);
			expect(publishSpy).toBeCalled();
		});

		test('should log exception', async () => {
			logger.error = jest.fn();
			jest
				.spyOn(ProductsTopic.prototype, 'publish')
				.mockResolvedValue(Promise.reject());

			try {
				await getProducts(req, res);
			} catch {}

			expect(logger.error).toBeCalled();
		});
	});
});
