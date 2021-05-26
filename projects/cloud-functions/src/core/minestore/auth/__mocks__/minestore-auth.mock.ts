import { MinestoreSessionData, MinestoreAuth } from '@core/minestore';
import { PuppeteerConnection } from '@core/puppeteer';
import { mockOpenConnection } from '@core/puppeteer/__mocks__/puppeteer.config.mock';

export const mockSession: MinestoreSessionData = {
	sessionId: 'test',
	authToken: 'test-token',
};

export class MinestoreAuthMock extends MinestoreAuth {
	public async loginOnce(): Promise<MinestoreSessionData> {
		return Promise.resolve(mockSession);
	}

	public async login(): Promise<PuppeteerConnection> {
		return Promise.resolve(mockOpenConnection());
	}
}
