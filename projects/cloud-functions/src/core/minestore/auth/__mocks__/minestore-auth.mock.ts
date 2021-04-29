import { MinestoreSessionData, MinestoreAuth } from '@core/minestore';

export const mockSession: MinestoreSessionData = {
	_session_id: 'test',
	authToken: 'test-token',
};

export class MinestoreAuthMock extends MinestoreAuth {
	public async login(): Promise<MinestoreSessionData> {
		return Promise.resolve<MinestoreSessionData>(mockSession);
	}
}
