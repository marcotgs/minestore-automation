import { ISubCollection, SubCollection } from 'fireorm';

import { DateFields } from '@db/base/date-fields';
import { Stock, StockSupplier } from './stock';

export enum ProductVariationStatus {
	new = 'NEW',
	available = 'AVAILABLE',
	sold_out = 'SOLD_OUT',
	synced_error = 'SYNCED_ERROR',
}

export class ProductVariation extends DateFields {
	id!: string;

	minestoreId: string;

	quantity: number;

	supplierUrl: string;

	status: ProductVariationStatus;

	sku: string;

	@SubCollection(Stock, `stock-${StockSupplier.star}`)
	stockStar?: ISubCollection<Stock>;
}
