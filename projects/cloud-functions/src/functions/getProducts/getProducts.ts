import { region, logger } from 'firebase-functions';

import { productRepository } from '@db/product';
import { ProductsTopic } from '@pubsub/products';
import { minestoreAuth } from '@core/minestore';

const productsTopic = new ProductsTopic();
productsTopic.create();

async function publishProductsTopic() {
	const minestoreSession = await minestoreAuth.login();
	// const products = await productRepository.find();
	const products = await productRepository.whereEqualTo('minestoreId', '4412762').find();
	await productsTopic.publish(products, minestoreSession);
	return products;
}

/**
 * * Scheduled function that run on each hour.
 * * In order to run this function locally, please use `firebase shell` or call the standalone `getProducts` function.
 */
export const getProducts = region('southamerica-east1')
	.runWith({ memory: '1GB' })
	.pubsub.schedule('0 9-20 * * *')
	.timeZone('America/Sao_Paulo')
	.onRun(
		async (context): Promise<any> => {
			logger.info(`start executing scheduledGetProducts - ${context.timestamp}`, {
				structuredData: true,
			});

			await publishProductsTopic();
			return null;
		},
	);

export const getProductsOnce = region('southamerica-east1')
	.runWith({ memory: '1GB' })
	.https.onRequest(async (_req, res) => {
		try {
			const products = await publishProductsTopic();
			res.json(products);
		} catch (ex) {
			logger.error(`get products -> Error: ${ex}`, {
				structuredData: true,
			});
			throw new Error(ex);
		}
	});
