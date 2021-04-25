/* eslint-disable @typescript-eslint/naming-convention */
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { MinestoreSessionData } from '@core/minestore/auth';
import { Product, Stock, StockType } from '@db/product';

export class MinestoreStock {
	private session: MinestoreSessionData;

	private product: Product;

	constructor(session: MinestoreSessionData, product: Product) {
		this.session = session;
		this.product = product;
	}

	async updateStock({ type, quantity }: Stock): Promise<void> {
		const { _session_id, authToken } = this.session;
		const { minestoreId } = this.product;

		const params = new URLSearchParams();
		params.append('utf8', '✓');
		params.append('inventory_movement[movement_type]', `${type === StockType.entry ? '98' : '99'}`);
		params.append('inventory_movement[quantity]', String(quantity));
		params.append('inventory_movement[transaction_date]', new Date().toLocaleDateString('pt-br'));
		params.append('inventory_movement[doc_number]', '');
		params.append(
			'inventory_movement[comment]',
			`sincronizado em ${new Date().toLocaleString('pt-br')}`,
		);
		params.append('commit', `registrar ${type === StockType.entry ? 'entrada' : 'saída'}`);

		try {
			await fetch(`${process.env.MINESTORE_BASE_URL}/estoques/${minestoreId}/movimentacoes/criar`, {
				method: 'POST',
				body: params,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'X-CSRF-Token': authToken,
					Cookie: `_session_id=${_session_id};`,
				},
			});
		} catch (ex) {
			console.log(ex);
		}
	}
}
