import { region, https, logger } from 'firebase-functions';
import { productRepository } from '@db/products';
import { ProductsTopic } from '@pubsub/products';

const productsTopic = new ProductsTopic();
productsTopic.create();

/**
 * * Scheduled function that run on each hour.
 * * In order to run this function locally, please use `firebase shell` or call the standalone `getProducts` function.
 */
export const scheduledGetProducts = region('southamerica-east1')
	.pubsub.schedule('0 */1 * * *')
	.timeZone('America/Sao_Paulo')
	.onRun(
		async (context): Promise<void> => {
			logger.info(`get products - ${context.timestamp}`, {
				structuredData: true,
			});
			const products = await productRepository.find();
			await productsTopic.publish(products);
		},
	);

export const getProducts = https.onRequest(async (_req, res) => {
	try {
		const products = await productRepository.find();
		await productsTopic.publish([products[0]]);
		res.json(products);
	} catch (ex) {
		logger.error(`get products -> Error: ${ex}`, {
			structuredData: true,
		});
		throw new Error(ex);
	}
});
