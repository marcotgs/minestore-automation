import { minestoreAuth, MinestoreStockVariation } from '@core/minestore';
import { productRepository } from '@db/product';
import { region, logger } from 'firebase-functions';

export const enableProductStock = region('southamerica-east1')
	.runWith({ memory: '1GB', timeoutSeconds: 120 })
	.https.onRequest(async (req, res) => {
		try {
			const { productId } = req.query;
			const product = await productRepository.findById(productId as string);
			if (!product) {
				res.sendStatus(404);
				return;
			}

			const connection = await minestoreAuth.login();
			const minestoreStockVariation = new MinestoreStockVariation(product, connection);
			await minestoreStockVariation.enableProductVariations();

			res.sendStatus(200);
		} catch (ex) {
			logger.error(`enableProduct -> Error: ${ex}`);
			throw new Error(ex);
		}
	});
