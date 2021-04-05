export interface Product {
	id: string;
	minestore_id: string;
	name: string;
	supplier_url: string;
	created_date: string;
	updated_date?: string;
	status: ProductStatus;
}

export enum ProductStatus {
	new = 'NEW',
	available = 'AVAILABLE',
	sold_out = 'SOLD_OUT',
	synced_error = 'SYNCED_ERROR',
}
