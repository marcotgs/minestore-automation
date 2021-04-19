import { pubsub, logger } from 'firebase-functions';
import { ProductsTopic } from '@pubsub/products';
import { productRepository } from '@db/products';
import { openConnection } from '@core/puppeteer';

const productTopic = new ProductsTopic();

export const updateQuantity = pubsub
	.topic(productTopic.topicName)
	.onPublish(async ({ json: { id } }) => {
		logger.info(`start updating quantity - product id: ${id}`);
		const { page } = await openConnection();

		const product = await productRepository.findById(id);
		await page.goto(product.supplier_url, { waitUntil: 'load' });
		const quantity = await page.$eval('#input-quantity', (inputEl) => inputEl.getAttribute('max'));
		logger.info(`${product.name}: ${quantity}`);

		return null;
	});
