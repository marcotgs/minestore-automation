import { region, logger } from 'firebase-functions';
// import { minestoreAuth } from '@core/minestore';

export const enableProductStock = region('southamerica-east1')
	.runWith({ memory: '1GB', timeoutSeconds: 120 })
	.https.onRequest(async (req, res) => {
		try {
			const { productId } = req.query;
			// const { page } = await minestoreAuth.login();
			res.json(productId);
		} catch (ex) {
			logger.error(`enableProduct -> Error: ${ex}`);
			throw new Error(ex);
		}
	});
