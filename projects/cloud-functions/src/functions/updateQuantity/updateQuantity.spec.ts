import { MinestoreStock } from '@core/minestore';
import { mockSession } from '@core/minestore/auth/__mocks__/minestore-auth.mock';
import { mockPage } from '@core/puppeteer/__mocks__/puppeteer.config.mock';
import { productRepository, ProductStatus } from '@db/product';
import { productsMocks } from '@db/product/__mocks__/products.mock';

jest.mock('@core/puppeteer', () => ({
	openConnection: jest.fn(() => Promise.resolve({ page: mockPage })),
}));
jest.mock('@core/minestore/stock');
jest.mock('@db/product');
jest.mock('firebase-functions', () => ({
	logger: {
		error: jest.fn(),
		info: jest.fn(),
	},
	config: jest.fn().mockReturnValue({ env: {} }),
	region: jest.fn().mockReturnValue({
		runWith: jest.fn().mockReturnValue({
			pubsub: {
				topic: jest.fn().mockReturnValue({
					onPublish: jest.fn((fn) => fn),
				}),
			},
		}),
	}),
}));

import { updateQuantity } from './updateQuantity';

describe('updateQuantity', () => {
	beforeEach(() => {
		MinestoreStock.prototype.updateVariationStock = jest.fn();
		productRepository.findById = jest.fn().mockResolvedValue(productsMocks[0]);
		productRepository.update = jest.fn();
	});
	const message = { json: { id: 'test', data: mockSession } };

	test('should get quantity from supplier and update quantity', async () => {
		const quantity = 20;
		mockPage.$ = jest.fn().mockResolvedValue(true);
		mockPage.$eval = jest.fn((_a, fn) => fn()).mockResolvedValue(20);

		await updateQuantity(message, {});

		expect(mockPage.goto).toBeCalledWith(expect.stringContaining(productsMocks[0].supplierUrl), {
			waitUntil: 'load',
		});

		expect(MinestoreStock.prototype.updateVariationStock).toBeCalledWith(quantity);
	});

	test('should update stock when product on supplier is sold out', async () => {
		mockPage.$ = jest.fn().mockResolvedValue(false);

		await updateQuantity(message, {});

		expect(mockPage.goto).toBeCalledWith(expect.stringContaining(productsMocks[0].supplierUrl), {
			waitUntil: 'load',
		});

		expect(MinestoreStock.prototype.updateVariationStock).toBeCalledWith(0);
	});

	test(`shouldn't update stock when product has the same quantity as the supplier`, async () => {
		mockPage.$ = jest.fn().mockResolvedValue(true);
		mockPage.$eval = jest.fn((_a, fn: any) => {
			return fn({ getAttribute: () => 2 });
		});

		await updateQuantity(message, {});

		expect(MinestoreStock.prototype.updateVariationStock).not.toHaveBeenCalled();
	});

	test(`should update product when an error was thrown`, async () => {
		mockPage.$ = jest.fn().mockImplementation(() => {
			throw new Error();
		});

		try {
			await updateQuantity(message, {});
		} catch {}

		expect(MinestoreStock.prototype.updateVariationStock).not.toHaveBeenCalled();
		expect(productRepository.update).toHaveBeenCalledWith(
			expect.objectContaining({ status: ProductStatus.synced_error }),
		);
	});
});
