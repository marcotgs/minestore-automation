import { Page } from 'puppeteer';
import firebaseTest from 'firebase-functions-test';

import {
	mockCloseConnection,
	mockOpenConnection,
	mockPage,
} from '@core/puppeteer/__mocks__/puppeteer.config.mock';
import { mockSession } from './__mocks__/minestore-auth.mock';
import { MinestoreAuth, MinestoreSessionData, SESSION_ID_KEY } from './minestore-auth';
import { environment } from '@testing/environment';

jest.mock('@core/puppeteer', () => ({
	openConnection: mockOpenConnection,
	closeConnection: mockCloseConnection,
}));

class TestMinestoreAuth extends MinestoreAuth {
	constructor() {
		super();
	}
	async testGetAuthData(): Promise<MinestoreSessionData> {
		return await super.getAuthData(mockPage as Page);
	}

	async testSubmitLoginForm(): Promise<void> {
		await super.submitLoginForm(mockPage as Page);
	}

	getAuthData(): Promise<MinestoreSessionData> {
		return Promise.resolve(mockSession);
	}
}

describe('MinestoreAuth', () => {
	const firebaseInstance = firebaseTest();
	let testMinestoreAuth: TestMinestoreAuth;

	beforeEach(() => {
		testMinestoreAuth = new TestMinestoreAuth();
	});

	afterEach(() => {
		firebaseInstance.mockConfig({
			env: environment,
		});
	});

	describe('login()', () => {
		test('should execute login and get session', async () => {
			const session = await testMinestoreAuth.login();

			expect(mockPage.goto).toBeCalledWith(expect.stringContaining('/entrar'), {
				waitUntil: 'load',
			});
			expect(mockPage.click).toBeCalledWith(expect.stringContaining('btn-login'));
			expect(mockPage.waitForSelector).toBeCalledWith(expect.stringContaining('main-nav'));
			expect(session).toEqual(mockSession);
			expect(mockCloseConnection).toHaveBeenCalledWith({ page: mockPage });
		});

		test('should throw exception', async () => {
			const message = 'error';
			mockPage.waitForSelector = jest.fn(() => {
				throw new Error(message);
			});

			try {
				await testMinestoreAuth.login();
			} catch (ex) {
				expect(ex.message).toContain(message);
			}
		});

		test('should use debugSession', async () => {
			const debugSession: MinestoreSessionData = {
				sessionId: 'test',
				authToken: 'as',
			};
			firebaseInstance.mockConfig({
				env: {
					...environment,
					minestore: {
						debugSession: debugSession,
					},
				},
			});

			const sessionData = await testMinestoreAuth.login();

			expect(sessionData).toEqual(debugSession);
		});

		describe('submitLoginForm()', () => {
			test('should fill data and submit form', async () => {
				const {
					minestore: { email, password },
				} = environment;
				await testMinestoreAuth.testSubmitLoginForm();

				expect(mockPage.focus).toBeCalledWith(expect.stringContaining('#user_email'));
				expect(mockPage.keyboard?.type).toBeCalledWith(expect.stringContaining(email));

				expect(mockPage.focus).toBeCalledWith(expect.stringContaining('#user_password'));
				expect(mockPage.keyboard?.type).toBeCalledWith(expect.stringContaining(password));

				expect(mockPage.click).toBeCalledWith(expect.stringContaining('btn-login'));
			});
		});

		describe('getAuthData()', () => {
			test('should get auth data in cookies and meta tags', async () => {
				const { sessionId, authToken } = mockSession;
				jest.spyOn(document, 'querySelector').mockReturnValue({
					content: authToken,
				} as HTMLMetaElement);
				mockPage.cookies = jest
					.fn()
					.mockResolvedValue([{ name: SESSION_ID_KEY, value: sessionId }]);

				const session = await testMinestoreAuth.testGetAuthData();

				expect(session).toEqual(mockSession);
			});
		});
	});
});
