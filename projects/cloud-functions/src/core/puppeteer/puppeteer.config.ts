import puppeteer, { Browser, Page } from 'puppeteer';

interface PuppeteerConnection {
	page?: Page;
	browser?: Browser;
}

const PUPPETEER_OPTIONS = {
	headless: true,
	args: [
		'--disable-gpu',
		'--disable-dev-shm-usage',
		'--disable-setuid-sandbox',
		'--no-first-run',
		'--no-sandbox',
		'--no-zygote',
		'--single-process',
		"--proxy-server='direct://'",
		'--proxy-bypass-list=*',
		'--deterministic-fetch',
	],
};

export const openConnection = async (): Promise<PuppeteerConnection> => {
	const browser = await puppeteer.launch({ product: 'chrome', ...PUPPETEER_OPTIONS });
	const page = await browser.newPage();
	await page.setUserAgent(
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
	);
	await page.setViewport({ width: 1680, height: 1050 });
	return { browser, page };
};

export const closeConnection = async (connection: PuppeteerConnection): Promise<void> => {
	const { page, browser } = connection;
	if (page) await page.close();
	if (browser) await browser.close();
};
