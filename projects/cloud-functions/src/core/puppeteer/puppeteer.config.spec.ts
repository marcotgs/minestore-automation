import { closeConnection, openConnection } from './puppeteer.config';
import puppeteer, { Browser, Page } from 'puppeteer';

jest.mock('puppeteer');

describe('Puppeteer config', () => {
	const mockPage: Partial<Page> = {
		close: jest.fn(),
	};
	const mockBrowser: Partial<Browser> = {
		close: jest.fn(),
		newPage: jest.fn().mockReturnValue(mockPage),
	};

	beforeEach(() => {
		puppeteer.launch = jest
			.fn<Promise<Browser>, any[]>()
			.mockImplementation(() => Promise.resolve(mockBrowser as Browser));
	});

	test('should open connection', async () => {
		const { page, browser } = await openConnection();

		expect(page).toEqual(mockPage);
		expect(browser).toEqual(mockBrowser);
		expect(mockBrowser.newPage).toBeCalled();
		expect(puppeteer.launch).toHaveBeenCalledWith(expect.objectContaining({ headless: true }));
	});

	test('should close connection', async () => {
		await closeConnection({ page: mockPage as Page, browser: mockBrowser as Browser });

		expect(mockBrowser.close).toBeCalled();
		expect(mockPage.close).toBeCalled();
	});

	test('should not close connection with browser and/or page is not defined', async () => {
		await closeConnection({});

		expect(mockBrowser.close).not.toBeCalled();
		expect(mockPage.close).not.toBeCalled();
	});
});
