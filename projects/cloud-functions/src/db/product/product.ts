import { Collection, getRepository, ISubCollection, SubCollection } from 'fireorm';
import { Stock, StockSupplier } from './stock';

export enum ProductStatus {
	new = 'NEW',
	available = 'AVAILABLE',
	sold_out = 'SOLD_OUT',
	synced_error = 'SYNCED_ERROR',
}
@Collection('products')
export class Product {
	id!: string;

	minestoreId!: string;

	name!: string;

	supplierUrl!: string;

	status: ProductStatus;

	createdDate?: string;

	updatedDate?: string;

	quantity?: number;

	@SubCollection(Stock, `stock-${StockSupplier.star}`)
	stockStar?: ISubCollection<Stock>;
}

export const productRepository = getRepository(Product);
