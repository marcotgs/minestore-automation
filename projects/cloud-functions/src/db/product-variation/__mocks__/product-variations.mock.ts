import { ProductVariation, ProductVariationStatus } from '../product-variation';

export const mockProductVariations: ProductVariation[] = [
	{
		id: 'test',
		minestoreId: '90060',
		sku: 'test',
		quantity: 2,
		supplierUrl: 'test-url',
		status: ProductVariationStatus.available,
		createdDate: 'Mon Apr 05 2021 07:04:09 GMT+0200 (Central European Summer Time)',
	},
	{
		id: 'test1',
		minestoreId: '32171',
		sku: 'test1',
		quantity: 0,
		supplierUrl: 'test1-url',
		status: ProductVariationStatus.sold_out,
		createdDate: 'Mon Apr 05 2021 07:04:09 GMT+0200 (Central European Summer Time)',
	},
];
