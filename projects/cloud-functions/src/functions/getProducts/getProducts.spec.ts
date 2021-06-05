import { Request, logger } from 'firebase-functions';
import { Product, productRepository } from '@db/product';
import { ProductsTopic } from '@core/pubsub/products-topic';
import { getProducts, getProductsOnce } from './getProducts';
import { minestoreAuth } from '@core/minestore';
import { productsMocks } from '@db/product/__mocks__/products.mock';
import { IQueryBuilder } from 'fireorm';

jest.mock('@core/pubsub');
jest.mock('@core/minestore');

describe('functions:getProducts', () => {
	const req = { body: {} } as Request;
	const res: any = { sendStatus: jest.fn() };

	const mockProducts = [productsMocks[0]];

	beforeEach(() => {
		process.env.NODE_ENV = 'development';
		const mockFirebaseQuery: Partial<IQueryBuilder<Product>> = {
			find: jest.fn().mockResolvedValue(mockProducts),
		};
		minestoreAuth.loginOnce = jest.fn().mockReturnValue(Promise.resolve());
		productRepository.whereEqualTo = jest
			.fn()
			.mockReturnValue(mockFirebaseQuery as IQueryBuilder<Product>);
		productRepository.find = jest.fn().mockResolvedValue(mockProducts);
		ProductsTopic.prototype.publish = jest.fn();
	});

	describe('getProducts', () => {
		test('should publish products to the topic from database', async () => {
			process.env.NODE_ENV = 'production';
			await getProducts({}, { timestamp: new Date().toISOString() });

			expect(productRepository.find).toBeCalled();
			expect(minestoreAuth.loginOnce).toBeCalled();
			expect(ProductsTopic.prototype.publish).toBeCalled();
		});
	});

	describe('getProductsOnce', () => {
		test('should publish products to the topic', async () => {
			await getProductsOnce(req, res);

			expect(res.sendStatus).toBeCalled();
			expect(minestoreAuth.loginOnce).toBeCalled();
			expect(ProductsTopic.prototype.publish).toBeCalled();
		});

		test('should log exception', async () => {
			logger.error = jest.fn();
			jest.spyOn(ProductsTopic.prototype, 'publish').mockResolvedValue(Promise.reject());

			try {
				await getProductsOnce(req, res);
			} catch {}

			expect(logger.error).toBeCalled();
		});

		test('should use development data', async () => {
			process.env.NODE_ENV = 'development';
			await getProductsOnce(req, res);

			expect(productRepository.whereEqualTo).toBeCalled();
			expect(minestoreAuth.loginOnce).toBeCalled();
			expect(ProductsTopic.prototype.publish).toBeCalled();
		});
	});
});
