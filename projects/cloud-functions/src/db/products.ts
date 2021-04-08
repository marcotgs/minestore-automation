import { Collection, getRepository } from 'fireorm';

export enum ProductStatus {
	new = 'NEW',
	available = 'AVAILABLE',
	sold_out = 'SOLD_OUT',
	synced_error = 'SYNCED_ERROR',
}

@Collection('products')
export class Product {
	id!: string;

	minestore_id!: string;

	name!: string;

	supplier_url!: string;

	status!: ProductStatus;

	created_date!: string;

	updated_date?: string;
}

export const productRepository = getRepository(Product);
