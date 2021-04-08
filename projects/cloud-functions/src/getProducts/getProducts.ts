import * as functions from 'firebase-functions';
import { productRepository } from '../db/products';

/**
 * * Scheduled function that run on each hour.
 * * In order to run this function locally, please use `firebase shell` or call the standalone `getProducts` function.
 */
export const scheduledGetProducts = functions
	.region('southamerica-east1')
	.pubsub.schedule('0 */1 * * *')
	.timeZone('America/Sao_Paulo')
	.onRun(async (context) => {
		functions.logger.info(`get products - ${context.timestamp}`, {
			structuredData: true,
		});
		await productRepository.find();
	});

export const getProducts = functions.https.onRequest(async (_req, res) => {
	const data = await productRepository.find();
	res.json(data);
});
