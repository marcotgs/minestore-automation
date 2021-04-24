import { pubsub, logger } from 'firebase-functions';
import { ProductsTopic } from '@pubsub/products';

import { productRepository } from '@db/product';
import { openConnection } from '@core/puppeteer';
import { MinestoreSessionData } from '@core/auth';

const productTopic = new ProductsTopic();
const connection = openConnection();

export const updateQuantity = pubsub
	.topic(productTopic.topicName)
	.onPublish(async ({ json: { id, data } }) => {
		const minestoreSession: MinestoreSessionData = data;
		const { page } = await connection;
		logger.info(`start updating quantity - product id: ${id}`);
		const { supplierUrl, name } = await productRepository.findById(id);

		await page?.goto(supplierUrl, { waitUntil: 'load' });
		const inputQuantitySelector = '#input-quantity';

		if (await page?.$(inputQuantitySelector)) {
			const quantity = await page?.$eval('#input-quantity', (inputEl) =>
				inputEl.getAttribute('max'),
			);
			logger.info(`${name}: ${quantity}`);
		} else {
			// TODO: get the quantity from the product and creates a out register with the same value, meaning products is sold out.
		}

		return null;
	});
