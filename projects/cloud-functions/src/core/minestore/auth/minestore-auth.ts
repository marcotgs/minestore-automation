/* eslint-disable no-underscore-dangle */
import { Page } from 'puppeteer';
import { closeConnection, openConnection } from '@core/puppeteer';

export interface MinestoreSessionData {
	_session_id?: string;
	authToken?: any;
}

class MinestoreAuth {
	public async login(): Promise<MinestoreSessionData> {
		if (process.env.MINESTORE_SESSION_DEBUG) {
			return JSON.parse(process.env.MINESTORE_SESSION_DEBUG);
		}
		const { page } = await openConnection();

		try {
			await page?.goto(`${process.env.MINESTORE_BASE_URL}/entrar`, {
				waitUntil: 'load',
			});

			await this.submitLoginForm(page as Page);
			await page?.waitForSelector('nav[class*="main-nav"]'); // admin page was loaded
			return await this.getAuthData(page as Page);
		} catch (e) {
			throw new Error(e);
		} finally {
			closeConnection({ page });
		}
	}

	private async getAuthData(page: Page): Promise<MinestoreSessionData> {
		const cookies = await page?.cookies();
		const sessionId = cookies?.find((cookie) => cookie.name === '_session_id')?.value;
		const authToken = await page.evaluate(() => {
			const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
			return Promise.resolve(csrfToken);
		});

		return { authToken, _session_id: sessionId };
	}

	private async submitLoginForm(page: Page): Promise<void> {
		await page.focus('#user_email');
		await page.keyboard.type(process.env.MINESTORE_LOGIN_EMAIL as string);
		await page.focus('#user_password');
		await page.keyboard.type(process.env.MINESTORE_LOGIN_PASSWORD as string);
		await page.click('.btn-login');
	}
}

export const minestoreAuth = new MinestoreAuth();
