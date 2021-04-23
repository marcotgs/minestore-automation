/* eslint-disable no-underscore-dangle */
import { Page } from 'puppeteer';
import { closeConnection, openConnection } from '@core/puppeteer';

interface AuthenticationData {
	_session_id?: string;
	authToken?: any;
}

export class MinestoreLogin {
	public authData: AuthenticationData = {};

	public async login(): Promise<void> {
		const { page } = await openConnection();
		try {
			await page?.goto('https://anjosdoamorsexshop.minestore.com.br/admin/entrar', {
				waitUntil: 'load',
			});

			await this.submitLoginForm(page as Page);
			await page?.waitForSelector('nav[class*="main-nav"]'); // admin page was loaded
			await this.getAuthData(page as Page);
		} catch (e) {
			throw new Error(e);
		} finally {
			closeConnection({ page });
		}
	}

	private async getAuthData(page: Page): Promise<void> {
		const cookies = await page?.cookies();
		this.authData._session_id = cookies?.find((cookie) => cookie.name === '_session_id')?.value;

		this.authData.authToken = await page.evaluate(() => {
			const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
			return Promise.resolve(csrfToken);
		});
	}

	private async submitLoginForm(page: Page): Promise<void> {
		const { MINESTORE_LOGIN_EMAIL, MINESTORE_LOGIN_PASSWORD } = process.env;
		await page.focus('#user_email');
		await page.keyboard.type(MINESTORE_LOGIN_EMAIL as string);
		await page.focus('#user_password');
		await page.keyboard.type(MINESTORE_LOGIN_PASSWORD as string);
		await page.click('.btn-login');
	}
}
