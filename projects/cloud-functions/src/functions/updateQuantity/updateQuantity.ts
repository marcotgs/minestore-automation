import { pubsub, logger } from 'firebase-functions';
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

export const updateQuantity = pubsub
	.topic(productTopic.topicName)
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
				logger.info(`updated stock quantity - ${id} - ${name}: ${quantity}`);
			}

			return;
		} catch (ex) {
			const updatedDate = new Date().toLocaleString('pt-br', { timeZone: process.env.TZ });
			logger.error(`Product id: ${product.id} - message: ${ex.message}`);
			productRepository.update({
				...product,
				status: ProductStatus.synced_error,
				updatedDate,
			});

			throw ex;
		}
	});
