import { Page } from 'puppeteer';
import { config } from 'firebase-functions';
import { closeConnection, openConnection } from '@core/puppeteer';

export const SESSION_ID_KEY = '_session_id';

export interface MinestoreSessionData {
	sessionId?: string;
	authToken?: any;
}
export class MinestoreAuth {
	public async login(): Promise<MinestoreSessionData> {
		const {
			minestore: { debugSession, baseUrl },
		} = config().env;

		if (debugSession) return debugSession;

		const { page } = await openConnection();

		try {
			await page.goto(`${baseUrl}/entrar`, {
				waitUntil: 'load',
			});

			await this.submitLoginForm(page);
			await page.waitForSelector('nav[class*="main-nav"]'); // admin page was loaded
			return await this.getAuthData(page);
		} catch (e) {
			throw new Error(e);
		} finally {
			closeConnection({ page });
		}
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
