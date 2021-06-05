import fetch, { Response } from 'node-fetch';
import { MinestoreStock } from '@core/minestore';
import { mockSession } from '@core/minestore/auth/__mocks__/minestore-auth.mock';
import { productRepository } from '@db/product';
import { productsMocks } from '@db/product/__mocks__/products.mock';
import { updateQuantity } from './updateQuantity';
import { mockProductVariations } from '@db/product-variation/__mocks__/product-variations.mock';

jest.mock('node-fetch', () => jest.fn());
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

describe('updateQuantity', () => {
	const product = productsMocks[1];
	const mockedQuantity = 20;

	const mockFetch = (quantity = mockedQuantity) => {
		const stockAvailability = quantity ? `max="${quantity}"` : '';
		(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
			text: () => Promise.resolve(`<input id="input-quantity" ${stockAvailability}/>`),
		} as Response);
	};

	beforeEach(() => {
		MinestoreStock.prototype.updateVariationStock = jest.fn();
		productRepository.findById = jest.fn().mockResolvedValue(product);
		productRepository.update = jest.fn();
	});
	const message = { json: { id: 'test', data: mockSession } };

	test('should get quantity from supplier and update quantity', async () => {
		mockFetch();
		await updateQuantity(message, {});

		expect(fetch).toBeCalled();

		expect(MinestoreStock.prototype.updateVariationStock).toBeCalledWith(
			mockedQuantity,
			mockProductVariations[0],
		);
	});

	test('should update stock when product on supplier is sold out', async () => {
		mockFetch(0);
		await updateQuantity(message, {});

		expect(fetch).toBeCalled();
		expect(MinestoreStock.prototype.updateVariationStock).toBeCalledWith(
			0,
			mockProductVariations[0],
		);
	});

	test(`shouldn't update stock when product has the same quantity as the supplier`, async () => {
		mockFetch(mockProductVariations[0].quantity);
		await updateQuantity(message, {});

		expect(MinestoreStock.prototype.updateVariationStock).not.toHaveBeenCalled();
	});
});
