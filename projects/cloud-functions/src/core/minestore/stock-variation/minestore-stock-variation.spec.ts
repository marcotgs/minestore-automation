import { mockBrowser, mockPage } from '@core/puppeteer/__mocks__/puppeteer.config.mock';
import { mockProductVariations } from '@db/product-variation/__mocks__/product-variations.mock';
import { productsMocks } from '@db/product/__mocks__/products.mock';
import { config, logger } from 'firebase-functions';
import { Browser, ElementHandle, Page } from 'puppeteer';
import { MinestoreStockVariation } from './minestore-stock-variation';

describe('MinestoreStockVariation', () => {
	let testMinestoreStockVariation: MinestoreStockVariation;
	const mockProduct = productsMocks[0];
	const btnStock = document.createElement('button');
	const mockedElementHandle = {
		click: jest.fn(),
		evaluate: jest.fn((fn: any, element) => fn(element)),
	} as Partial<ElementHandle>;
	const mockedBtnVariations = mockProductVariations.map(
		() => mockedElementHandle,
	) as ElementHandle[];

	beforeEach(() => {
		const mockedVariationsEls = mockProductVariations.map(({ sku, id }) => {
			const el = document.createElement('div');
			el.textContent = sku;
			el.id = `variant-${id}`;
			return el;
		});

		mockPage.$ = jest.fn().mockResolvedValue(mockedElementHandle);
		mockPage.$$ = jest.fn().mockResolvedValue(mockedBtnVariations);
		mockPage.$$eval = jest.fn((_a, fn: any) => fn(mockedVariationsEls));
		mockPage.$eval = jest.fn((_selector, fn: any) => {
			btnStock.setAttribute('disabled', 'disabled');
			return fn(btnStock);
		});
		testMinestoreStockVariation = new MinestoreStockVariation(mockProduct, {
			page: mockPage as Page,
			browser: mockBrowser as Browser,
		});
	});

	test('should open product minestore url', async () => {
		const { minestoreId } = mockProduct;
		const {
			minestore: { baseUrl },
		} = config().env;

		await testMinestoreStockVariation.enableProductVariations();

		expect(mockPage.goto).toBeCalledWith(`${baseUrl}/produtos/${minestoreId}`, {
			waitUntil: 'load',
		});
	});

	test('should query variation elements data', async () => {
		await testMinestoreStockVariation.enableProductVariations();

		expect(mockPage.$$).toBeCalledWith(
			'.product-variations tbody tr .variation-actions .edit-variant',
		);
		expect(mockPage.$$eval).toBeCalledWith(
			'.product-variations tbody tr .variation-sku',
			expect.any(Function),
		);
		expect(mockPage.$$eval).toBeCalledWith('.product-variations tbody tr', expect.any(Function));
	});

	test('should await elements on the page to load', async () => {
		await testMinestoreStockVariation.enableProductVariations();

		expect(mockPage.waitForTimeout).toBeCalledWith(300);
		expect(mockPage.waitForSelector).toBeCalledWith('#modal-window .close');
		expect(mockPage.waitForSelector).toBeCalledWith('#product_variant_inventory_quantity');
		expect(mockPage.waitForSelector).toBeCalledWith('.modal-content .block-price .checkbox', {
			visible: true,
		});
	});

	test('should enable stock if btnStock is disabled', async () => {
		await testMinestoreStockVariation.enableProductVariations();

		expect(mockPage.$).toBeCalledWith('.modal-content .block-price .checkbox');
		expect(mockPage.$).toBeCalledWith('.modal-content .btn-success');
		expect(mockedElementHandle.click).toBeCalled();
		expect(mockedElementHandle.evaluate).toBeCalled();
		expect(mockPage.waitForTimeout).toBeCalledWith(1000);
	});

	test('should just close modal stock if btnStock is enable', async () => {
		mockPage.$eval = jest.fn((_selector, fn: any) => {
			btnStock.setAttribute('disabled', '');
			return fn(btnStock);
		});

		await testMinestoreStockVariation.enableProductVariations();

		expect(mockedElementHandle.evaluate).toBeCalled();
		expect(mockPage.waitForTimeout).toBeCalledWith(300);
	});

	test('should log exception', async () => {
		logger.error = jest.fn();
		mockPage.$ = jest.fn().mockRejectedValue('message');
		const { minestoreId } = mockProduct;

		try {
			await testMinestoreStockVariation.enableProductVariations();
		} catch {}

		mockProductVariations.forEach(({ sku }) => {
			expect(logger.error).toBeCalledWith(expect.any(String), {
				sku,
				url: `https://anjosdoamorsexshop.minestore.com.br/admin/produtos/${minestoreId}`,
			});
		});
	});

	test('should evaluate btn variation', async () => {
		const { sku } = mockProductVariations[0];
		mockPage.$$ = jest.fn().mockResolvedValue(
			mockedBtnVariations.map((handle) => ({
				...handle,
				click: jest.fn().mockRejectedValue(null),
			})),
		);

		await testMinestoreStockVariation.enableProductVariations();

		expect(mockPage.$).toBeCalledWith(`#variant-${sku} .variation-actions .edit-variant`);
	});

	test('should not execute query when connection is undefined', async () => {
		testMinestoreStockVariation = new MinestoreStockVariation(mockProduct, {
			page: mockPage as Page,
		});

		await testMinestoreStockVariation.enableProductVariations();

		expect(mockBrowser.newPage).not.toBeCalled();
	});

	test('should not eval variation elements when there is no variation', async () => {
		mockPage.$$ = jest.fn().mockResolvedValue(undefined);
		mockPage.$$eval = jest.fn().mockResolvedValue(undefined);

		await testMinestoreStockVariation.enableProductVariations();

		expect(mockPage.waitForSelector).not.toBeCalledWith('#modal-window .close');
	});

	test('should not enable variation if checkbox is not present', async () => {
		mockPage.$ = jest.fn().mockResolvedValue(undefined);

		await testMinestoreStockVariation.enableProductVariations();

		expect(mockedElementHandle.evaluate).not.toBeCalled();
	});
});
