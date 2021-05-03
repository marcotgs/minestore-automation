import { region } from 'firebase-functions';
import { info } from 'firebase-functions/lib/logger';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

import { ProductsTopic } from '@core/pubsub/products-topic';
import { productRepository } from '@db/product';
import { MinestoreStock } from '@core/minestore';

const productTopic = new ProductsTopic();

const getQuantity = async (supplierUrl: string): Promise<number> => {
	const response = await fetch(supplierUrl);
	const body = await response.text();
	const $ = cheerio.load(body);

	const quantityInput = $('#input-quantity');
	return Number(quantityInput.attr('max') ?? 0);
};

export const updateQuantity = region('southamerica-east1')
	.runWith({ memory: '1GB' })
	.pubsub.topic(productTopic.topicName)
	.onPublish(async ({ json: { id, data: session } }) => {
		const product = await productRepository.findById(id);

		const minestoreStock = new MinestoreStock(session, product);
		const { variations } = product;

		const productVariations = (await variations?.find()) ?? [];
		await Promise.all(
			productVariations.map(async (variation) => {
				const { id: variationId, quantity, supplierUrl } = variation;
				const quantitySupplier = await getQuantity(supplierUrl);

				if (quantitySupplier !== quantity) {
					await minestoreStock.updateVariationStock(quantitySupplier, variation);
					info(`synced stock quantity`, {
						product: id,
						variation: variationId,
						quantity: quantitySupplier,
					});
					return;
				}

				info('stock and supplier are even', {
					product: id,
					variation: variationId,
					quantity,
				});
			}),
		);
	});
