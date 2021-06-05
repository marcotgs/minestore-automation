import fetch, { Response } from 'node-fetch';
import { URLSearchParams } from 'url';
import { logger } from 'firebase-functions';

import { Product, productRepository } from '@db/product';
import { MinestoreSessionData } from '@core/minestore/auth';
import { productsMocks } from '@db/product/__mocks__/products.mock';
import { mockSession } from '@core/minestore/auth/__mocks__/minestore-auth.mock';
import { MinestoreStock } from './minestore-stock';
import { environment } from '@testing/environment';
import { ProductVariation, ProductVariationStatus, Stock, StockType } from '@db/product-variation';
import { mockProductVariations } from '@db/product-variation/__mocks__/product-variations.mock';

jest.mock('node-fetch', () => jest.fn());
jest.mock('@db/product');

class TestMinestoreStock extends MinestoreStock {
	constructor(session: MinestoreSessionData, product: Product) {
		super(session, product);
	}

	async testPostUpdateMinestoreStock(stock: Stock, variation: ProductVariation): Promise<void> {
		await super.postUpdateMinestoreStock(stock, variation);
	}

	async testCreateStock(quantitySupplier: number, variation: ProductVariation): Promise<void> {
		await super.createStock(quantitySupplier, variation);
	}

	async testUpdateVariation(quantitySupplier: number, variation: ProductVariation): Promise<void> {
		await super.updateVariation(quantitySupplier, variation);
	}
}

describe('MinestoreStock', () => {
	const date = '2020-04-15';
	let testMinestoreStock: TestMinestoreStock;
	let mockProduct: Product;
	let mockProductVariation = mockProductVariations[0];
	let mockDate: jest.SpyInstance<string, any[]>;

	beforeEach(() => {
		productRepository.update = jest.fn();
		mockProduct = productsMocks[0];
		testMinestoreStock = new TestMinestoreStock(mockSession, productsMocks[0]);
		mockDate = jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue(date);
	});

	afterAll(() => {
		mockDate.mockRestore();
	});

	describe('updateVariationStock()', () => {
		test('should call helper methods that handles the stock update', async () => {
			(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({ ok: true } as Response);
			const {
				minestore: { baseUrl },
			} = environment;
			const { stockStar, minestoreId } = mockProductVariation;

			await testMinestoreStock.updateVariationStock(2, mockProductVariation);

			expect(stockStar?.create).toBeCalled();
			expect(fetch).toBeCalledWith(
				`${baseUrl}/estoques/${minestoreId}/movimentacoes/criar`,
				expect.objectContaining({
					method: 'POST',
				}),
			);
		});

		test(`should throw error when response isn't ok`, async () => {
			logger.error = jest.fn();
			const textResponse = 'message';
			const response: Partial<Response> = {
				ok: false,
				text: jest.fn().mockResolvedValue(Promise.reject(textResponse)),
			};
			(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(response as Response);

			try {
				await testMinestoreStock.updateVariationStock(2, mockProductVariations[0]);
			} catch (ex) {
				expect(ex.message).toBe(textResponse);
				expect(logger.error).toBeCalled();
			}
		});
	});

	describe('postUpdateMinestoreStock()', () => {
		let mockStock: Stock;

		const getParams = ({ type, quantity }: Stock) => {
			new Date().toLocaleString = jest.fn().mockReturnValue(mockDate);
			const params = new URLSearchParams();

			params.append('utf8', '✓');
			params.append(
				'inventory_movement[movement_type]',
				`${type === StockType.entry ? '98' : '99'}`,
			);
			params.append('inventory_movement[quantity]', String(quantity));
			params.append('inventory_movement[transaction_date]', date);
			params.append('inventory_movement[doc_number]', '');
			params.append('inventory_movement[comment]', `sincronizado em ${date}`);
			params.append('commit', `registrar ${type === StockType.entry ? 'entrada' : 'saída'}`);
			return params;
		};

		beforeEach(() => {
			mockStock = {
				id: 'test',
				quantity: 20,
				createdDate: 'Sat May 01 2021 08:31:18 GMT+0200 (Central European Summer Time)',
			};
		});

		test('should execute request with entry stock data', async () => {
			(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({ ok: true } as Response);
			const {
				minestore: { baseUrl },
			} = environment;
			const { minestoreId } = mockProductVariation;
			mockStock.type = StockType.entry;

			await testMinestoreStock.testPostUpdateMinestoreStock(mockStock, mockProductVariation);

			expect(fetch).toBeCalledWith(
				`${baseUrl}/estoques/${minestoreId}/movimentacoes/criar`,
				expect.objectContaining({
					method: 'POST',
					body: getParams(mockStock),
				}),
			);
		});

		test('should execute request with out stock data', async () => {
			(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({ ok: true } as Response);
			const {
				minestore: { baseUrl },
			} = environment;
			const { minestoreId } = mockProductVariation;
			mockStock.type = StockType.out;

			await testMinestoreStock.testPostUpdateMinestoreStock(mockStock, mockProductVariation);

			expect(fetch).toBeCalledWith(
				`${baseUrl}/estoques/${minestoreId}/movimentacoes/criar`,
				expect.objectContaining({
					method: 'POST',
					body: getParams(mockStock),
				}),
			);
		});
	});

	describe('createStock()', () => {
		test('should create an entry stock document', async () => {
			const { stockStar } = mockProductVariation;
			const quantitySupplier = 3;

			await testMinestoreStock.testCreateStock(quantitySupplier, {
				...mockProductVariation,
				quantity: undefined,
			});

			expect(stockStar?.create).toBeCalledWith({
				updatedDate: date,
				type: StockType.entry,
				quantity: quantitySupplier,
			});
		});

		test('should create an out stock document', async () => {
			const { stockStar } = mockProductVariation;
			const quantitySupplier = 0;

			await testMinestoreStock.testCreateStock(quantitySupplier, mockProductVariations[0]);

			expect(stockStar?.create).toBeCalledWith({
				updatedDate: date,
				type: StockType.out,
				quantity: 2,
			});
		});
	});

	describe('updateVariation()', () => {
		test('should update quantity product variation', async () => {
			const quantitySupplier = 3;

			await testMinestoreStock.testUpdateVariation(quantitySupplier, mockProductVariations[0]);

			expect(mockProduct.variations?.update).toBeCalledWith(
				expect.objectContaining({
					quantity: quantitySupplier,
					status: ProductVariationStatus.available,
				}),
			);
		});

		test(`should update quantity product when it's sold out`, async () => {
			const quantitySupplier = 0;

			await testMinestoreStock.testUpdateVariation(quantitySupplier, mockProductVariations[0]);

			expect(mockProduct.variations?.update).toBeCalledWith(
				expect.objectContaining({
					quantity: quantitySupplier,
					status: ProductVariationStatus.sold_out,
				}),
			);
		});
	});
});
