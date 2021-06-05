import puppeteer, { Browser, Page } from 'puppeteer';

export interface PuppeteerConnection {
	page: Page;
	browser?: Browser;
}

const PUPPETEER_OPTIONS = {
	headless: true,
	args: ['--no-sandbox'],
};

export const openConnection = async (): Promise<PuppeteerConnection> => {
	const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
	const page = await browser.newPage();
	return { browser, page };
};

export const closeConnection = async (connection: PuppeteerConnection): Promise<void> => {
	const { page, browser } = connection;
	await page.close();
	if (browser) await browser.close();
};
