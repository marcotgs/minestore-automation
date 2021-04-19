import { Product, ProductStatus } from '@db/products';

export const productsMocks: Product[] = [
	{
		id: 'test',
		minestore_id: '1212',
		name: 'Sleek Steel Bike',
		created_date: 'Mon Apr 05 2021 07:04:09 GMT+0200 (Central European Summer Time)',
		supplier_url: 'http://raquel.net',
		status: ProductStatus.new,
	},
	{
		id: 'test2',
		minestore_id: '74640',
		name: 'Sleek Wooden Soap',
		created_date: 'Mon Apr 05 2021 07:04:09 GMT+0200 (Central European Summer Time)',
		supplier_url: 'http://lura.name',
		status: ProductStatus.new,
	},
];
