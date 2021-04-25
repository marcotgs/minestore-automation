import { pubsub, logger } from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { Page } from 'puppeteer';

import { ProductsTopic } from '@pubsub/products';
import { Product, productRepository, ProductStatus, Stock, StockType } from '@db/product';
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

async function updateStock(
	{ stockStar, ...rest }: Product,
	quantitySupplier: number,
): Promise<Stock> {
	const date = firestore.Timestamp.now().toDate().toString();
	const stockUpdate: Partial<Stock> = { quantity: quantitySupplier, date, type: StockType.entry };
	const productUpdate: Partial<Product> = {
		quantity: quantitySupplier,
		updatedDate: date,
		status: ProductStatus.available,
	};

	if (!quantitySupplier) {
		const lastRegisterStock = await stockStar?.orderByDescending('date').findOne();
		stockUpdate.quantity = lastRegisterStock?.quantity ?? 0;
		stockUpdate.type = StockType.out;
		productUpdate.quantity = 0;
		productUpdate.status = ProductStatus.sold_out;
	}

	productRepository.update({
		...rest,
		...productUpdate,
	});
	stockStar?.create(stockUpdate as Stock);
	return stockUpdate as Stock;
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
				const stockData = await updateStock(product, quantity);
				await minestoreStock.updateStock(stockData);
				logger.info(`updated stock quantity - ${id} - ${name}: ${quantity}`);
			}

			return;
		} catch (ex) {
			const updatedDate = firestore.Timestamp.now().toDate().toString();
			logger.error(`Product id: ${product.id} - message: ${ex.message}`);
			productRepository.update({
				...product,
				status: ProductStatus.synced_error,
				updatedDate,
			});

			throw ex;
		}
	});
