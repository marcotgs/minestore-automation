/* eslint-disable @typescript-eslint/naming-convention */
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { config, logger } from 'firebase-functions';
import { MinestoreSessionData } from '@core/minestore/auth';
import { Product, productRepository, ProductStatus, Stock, StockType } from '@db/product';

export class MinestoreStock {
	private session: MinestoreSessionData;

	private product: Product;

	constructor(session: MinestoreSessionData, product: Product) {
		this.session = session;
		this.product = product;
	}

	async updateStock(quantitySupplier: number): Promise<void> {
		const {
			timezone: timeZone,
			minestore: { baseUrl },
		} = config().env;
		const { _session_id, authToken } = this.session;
		const { minestoreId } = this.product;
		const date = new Date().toLocaleString('pt-br', { timeZone });

		const { type, quantity } = await this.createStock(quantitySupplier);
		await this.updateProduct(quantitySupplier);

		const params = new URLSearchParams();
		params.append('utf8', '✓');
		params.append('inventory_movement[movement_type]', `${type === StockType.entry ? '98' : '99'}`);
		params.append('inventory_movement[quantity]', String(quantity));
		params.append('inventory_movement[transaction_date]', date);
		params.append('inventory_movement[doc_number]', '');
		params.append('inventory_movement[comment]', `sincronizado em ${date}`);
		params.append('commit', `registrar ${type === StockType.entry ? 'entrada' : 'saída'}`);

		try {
			const response = await fetch(`${baseUrl}/estoques/${minestoreId}/movimentacoes/criar`, {
				method: 'POST',
				body: params,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'X-CSRF-Token': authToken,
					Cookie: `_session_id=${_session_id};`,
				},
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}
		} catch (ex) {
			logger.error(`error when updating stock - ex: ${ex.message}`);
		}
	}

	private async createStock(quantitySupplier: number): Promise<Stock> {
		const { timezone: timeZone } = config().env;
		const { stockStar, quantity } = this.product;
		const date = new Date().toLocaleString('pt-br', { timeZone });
		const stockQuantity = quantity ?? 0;
		const stockDifferenceQuantity = Math.abs(stockQuantity - quantitySupplier);
		const newStock: Partial<Stock> = { quantity: quantitySupplier, date, type: StockType.entry };

		newStock.type = stockQuantity >= quantitySupplier ? StockType.out : StockType.entry;
		newStock.quantity = stockDifferenceQuantity;
		stockStar?.create(newStock as Stock);
		return newStock as Stock;
	}

	private async updateProduct(quantitySupplier: number): Promise<void> {
		const { timezone: timeZone } = config().env;
		const date = new Date().toLocaleString('pt-br', { timeZone });
		const productUpdate: Partial<Product> = {
			quantity: quantitySupplier,
			updatedDate: date,
			status: ProductStatus.available,
		};

		productUpdate.quantity = quantitySupplier;
		productUpdate.status = !quantitySupplier ? ProductStatus.sold_out : ProductStatus.available;
		productUpdate.updatedDate = date;
		productRepository.update({
			...this.product,
			...productUpdate,
		});
	}
}
