import { config, logger, region } from 'firebase-functions';
import { Page } from 'puppeteer';

import { ProductsTopic } from '@pubsub/products';
import { productRepository, ProductStatus } from '@db/product';
import { openConnection } from '@core/puppeteer';
import { MinestoreStock } from '@core/minestore';

const productTopic = new ProductsTopic();
const connection = openConnection();

async function getQuantity(page: Page): Promise<number> {
	const inputQuantitySelector = '#input-quantity';
	if (await page?.$(inputQuantitySelector)) {
		return Number(
			await page?.$eval(inputQuantitySelector, (inputEl) => inputEl.getAttribute('max')),
		);
	}

	return 0; // sold out
}

export const updateQuantity = region('southamerica-east1')
	.runWith({ memory: '1GB' })
	.pubsub.topic(productTopic.topicName)
	.onPublish(async ({ json: { id, data: session } }) => {
		const { page } = await connection;
		const product = await productRepository.findById(id);

		try {
			const minestoreStock = new MinestoreStock(session, product);
			const { supplierUrl, name } = product;

			await page?.goto(supplierUrl, { waitUntil: 'load' });
			const quantity = await getQuantity(page as Page);

			if (quantity !== product.quantity) {
				await minestoreStock.updateStock(quantity);
				logger.info(`synced stock quantity - ${id} - ${name}: ${quantity}`);
				return;
			}

			logger.info(`stock and supplier are even - ${id} - ${name}: ${quantity}`);
			return;
		} catch (ex) {
			const { timezone: timeZone } = config().env;
			const updatedDate = new Date().toLocaleString('pt-BR', { timeZone });
			logger.error(`Product id: ${product.id} - message: ${ex.message}`);
			productRepository.update({
				...product,
				status: ProductStatus.synced_error,
				updatedDate,
			});

			throw ex;
		}
	});
