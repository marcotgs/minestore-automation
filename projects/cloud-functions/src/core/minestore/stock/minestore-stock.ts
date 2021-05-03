/* eslint-disable @typescript-eslint/naming-convention */
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { config, logger } from 'firebase-functions';
import { MinestoreSessionData, SESSION_ID_KEY } from '@core/minestore/auth';
import { Product } from '@db/product';
import { ProductVariation, ProductVariationStatus, Stock, StockType } from '@db/product-variation';

export class MinestoreStock {
	private session: MinestoreSessionData;

	private product: Product;

	constructor(session: MinestoreSessionData, product: Product) {
		this.session = session;
		this.product = product;
	}

	async updateVariationStock(quantitySupplier: number, variation: ProductVariation): Promise<void> {
		const { variations, id } = this.product;
		try {
			const stock = await this.createStock(quantitySupplier, variation);
			await this.updateVariation(quantitySupplier, variation);
			await this.postUpdateMinestoreStock(stock, variation);
		} catch (ex) {
			const { timezone: timeZone } = config().env;
			const updatedDate = new Date().toLocaleString('pt-BR', { timeZone });

			variations?.update({
				...variation,
				status: ProductVariationStatus.synced_error,
				updatedDate,
			});

			logger.error(`Error while updating the stock - message: ${ex.message}`, {
				product: id,
				variation: variation.id,
			});
		}
	}

	protected async postUpdateMinestoreStock(
		{ type, quantity }: Stock,
		variation: ProductVariation,
	): Promise<void> {
		const {
			timezone: timeZone,
			minestore: { baseUrl },
		} = config().env;
		const { sessionId: _session_id, authToken } = this.session;
		const { minestoreId } = variation;
		const date = new Date().toLocaleString('pt-br', { timeZone });
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
					Cookie: `${SESSION_ID_KEY}=${_session_id};`,
				},
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}
		} catch (ex) {
			logger.error(`error when updating stock - ex: ${ex.message}`);
		}
	}

	protected async createStock(
		quantitySupplier: number,
		variation: ProductVariation,
	): Promise<Stock> {
		const { timezone: timeZone } = config().env;
		const { stockStar, quantity } = variation;
		const date = new Date().toLocaleString('pt-br', { timeZone });

		const stockQuantity = quantity ?? 0;
		const stockDifferenceQuantity = Math.abs(stockQuantity - quantitySupplier);
		const newStock: Partial<Stock> = {
			quantity: quantitySupplier,
			updatedDate: date,
			type: StockType.entry,
		};

		newStock.type = stockQuantity >= quantitySupplier ? StockType.out : StockType.entry;
		newStock.quantity = stockDifferenceQuantity;
		stockStar?.create(newStock as Stock);
		return newStock as Stock;
	}

	protected async updateVariation(
		quantitySupplier: number,
		variation: ProductVariation,
	): Promise<void> {
		const { timezone: timeZone } = config().env;
		const { variations } = this.product;
		const date = new Date().toLocaleString('pt-br', { timeZone });
		const variationUpdate: Partial<ProductVariation> = {
			quantity: quantitySupplier,
			updatedDate: date,
		};

		variationUpdate.quantity = quantitySupplier;
		variationUpdate.updatedDate = date;
		variationUpdate.status = !quantitySupplier
			? ProductVariationStatus.sold_out
			: ProductVariationStatus.available;

		variations?.update({
			...variation,
			...variationUpdate,
		});
	}
}
