import { minestoreAuth, MinestoreStockVariation } from '@core/minestore';
import { mockPage } from '@core/puppeteer/__mocks__/puppeteer.config.mock';
import { productRepository } from '@db/product';
import { productsMocks } from '@db/product/__mocks__/products.mock';
import { Response, Request, logger } from 'firebase-functions';
import { enableProductStock } from './enableProductStock';

describe('functions:EnableProduct', () => {
	const req: Partial<Request> = { query: { productId: 'test' } };
	const res: Partial<Response> = { sendStatus: jest.fn() };

	const mockProduct = productsMocks[0];

	beforeEach(() => {
		minestoreAuth.login = jest.fn().mockReturnValue(Promise.resolve({ page: mockPage }));
		MinestoreStockVariation.prototype.enableProductVariations = jest.fn();
		productRepository.findById = jest.fn().mockResolvedValue(mockProduct);
	});

	test(`should return 404 when product doesn't exist`, async () => {
		productRepository.findById = jest.fn().mockResolvedValue(null);

		await enableProductStock(req as Request, res as Response);

		expect(res.sendStatus).toBeCalledWith(404);
	});

	test('should enable product stock on Minestore', async () => {
		await enableProductStock(req as Request, res as Response);

		expect(minestoreAuth.login).toBeCalled();
		expect(MinestoreStockVariation.prototype.enableProductVariations).toBeCalled();
	});

	test('should log exception', async () => {
		productRepository.findById = jest.fn().mockRejectedValue(null);
		logger.error = jest.fn();
		try {
			await enableProductStock(req as Request, res as Response);
		} catch {}

		expect(logger.error).toBeCalled();
	});
});
