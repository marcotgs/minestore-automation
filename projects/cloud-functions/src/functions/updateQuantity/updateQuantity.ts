import { pubsub, logger } from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { Page } from 'puppeteer';

import { ProductsTopic } from '@pubsub/products';
import { Product, productRepository, ProductStatus, Stock, StockType } from '@db/product';
import { openConnection } from '@core/puppeteer';
import { MinestoreSessionData } from '@core/auth';

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

async function updateStock({ stock, ...rest }: Product, quantitySupplier: number) {
	const date = firestore.Timestamp.now().toDate().toString();
	const stockUpdate: Partial<Stock> = { quantity: quantitySupplier, date, type: StockType.entry };
	const productUpdate: Partial<Product> = {
		quantity: quantitySupplier,
		updatedDate: date,
		status: ProductStatus.available,
	};

	if (!quantitySupplier) {
		const lastRegisterStock = await stock?.orderByDescending('date').findOne();
		stockUpdate.quantity = lastRegisterStock?.quantity ?? 0;
		stockUpdate.type = StockType.out;
		productUpdate.quantity = 0;
		productUpdate.status = ProductStatus.sold_out;
	}

	productRepository.update({
		...rest,
		...productUpdate,
	});
	stock?.create(stockUpdate as Stock);
}

export const updateQuantity = pubsub
	.topic(productTopic.topicName)
	.onPublish(async ({ json: { id, data } }) => {
		const { page } = await connection;
		try {
			const minestoreSession: MinestoreSessionData = data;
			const product = await productRepository.findById(id);
			const { supplierUrl, name } = product;

			await page?.goto(supplierUrl, { waitUntil: 'load' });
			const quantity = await getQuantity(page as Page);

			if (quantity !== product.quantity) {
				await updateStock(product, quantity);
				logger.info(`updated stock quantity - ${id} - ${name}: ${quantity}`);
			}

			return;
		} catch (ex) {
			logger.error(ex);
			throw new Error(ex);
		}
	});
