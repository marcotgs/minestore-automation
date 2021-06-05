import { Page } from 'puppeteer';
import { config } from 'firebase-functions';
import { closeConnection, openConnection, PuppeteerConnection } from '@core/puppeteer';

export const SESSION_ID_KEY = '_session_id';

export interface MinestoreSessionData {
	sessionId?: string;
	authToken?: any;
}
export class MinestoreAuth {
	/**
	 * Executes the login on `Minestore` and closes all the connections.
	 */
	public async loginOnce(): Promise<MinestoreSessionData> {
		const connection = await openConnection();

		try {
			return await this.executeLogin(connection);
		} catch (e) {
			throw new Error(e);
		} finally {
			closeConnection(connection);
		}
	}

	/**
	 * Executes the login on `Minestore` and keep connection open to be used later on.
	 */
	public async login(): Promise<PuppeteerConnection> {
		const connection = await openConnection();
		try {
			await this.executeLogin(connection);
			return connection;
		} catch (e) {
			throw new Error(e);
		}
	}

	protected async executeLogin({ page }: PuppeteerConnection): Promise<MinestoreSessionData> {
		const {
			minestore: { debugSession, baseUrl },
		} = config().env;

		if (debugSession) return debugSession;

		await page.goto(`${baseUrl}/entrar`, {
			waitUntil: 'load',
		});

		await this.submitLoginForm(page);
		await page.waitForSelector('nav[class*="main-nav"]'); // admin page was loaded
		return this.getAuthData(page);
	}

	protected async getAuthData(page: Page): Promise<MinestoreSessionData> {
		const cookies = await page.cookies();
		const sessionId = cookies.find((cookie: any) => cookie.name === SESSION_ID_KEY)?.value;
		const authToken = await page.evaluate(() => {
			const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
			return Promise.resolve(csrfToken);
		});

		return { authToken, sessionId };
	}

	protected async submitLoginForm(page: Page): Promise<void> {
		const {
			minestore: { email, password },
		} = config().env;

		await page.focus('#user_email');
		await page.keyboard.type(email);
		await page.focus('#user_password');
		await page.keyboard.type(password);
		await page.click('.btn-login');
	}
}

export const minestoreAuth = new MinestoreAuth();
