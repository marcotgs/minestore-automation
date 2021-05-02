import { Page, Browser, Keyboard } from 'puppeteer';
import { PuppeteerConnection } from '../puppeteer.config';

const mockKeyboard: Partial<Keyboard> = {
	type: jest.fn(),
};

export const mockPage: Partial<Page> = {
	$: jest.fn(),
	$eval: jest.fn((_a, fn: any) => fn()),
	close: jest.fn(),
	goto: jest.fn(),
	focus: jest.fn(),
	click: jest.fn(),
	waitForSelector: jest.fn(),
	evaluate: jest.fn((fn: any) => fn()),
	cookies: jest.fn(),
	keyboard: mockKeyboard as Keyboard,
};

export const mockBrowser: Partial<Browser> = {
	close: jest.fn(),
	newPage: jest.fn().mockReturnValue(mockPage),
};

export const mockOpenConnection = jest
	.fn()
	.mockReturnValue(Promise.resolve({ browser: mockBrowser as Browser, page: mockPage as Page }));

export const mockCloseConnection = jest
	.fn()
	.mockImplementation((connection: PuppeteerConnection): PuppeteerConnection => connection);
