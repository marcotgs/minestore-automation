import { Product, ProductStatus } from '@db/product';

export const productsMocks: Product[] = [
	{
		id: 'test',
		minestoreId: '4412762',
		name: 'Sleek Steel Bike',
		createdDate: 'Mon Apr 05 2021 07:04:09 GMT+0200 (Central European Summer Time)',
		supplierUrl: 'http://raquel.net',
		quantity: 2,
		status: ProductStatus.new,
	},
	{
		id: 'test2',
		minestoreId: '74640',
		name: 'Sleek Wooden Soap',
		createdDate: 'Mon Apr 05 2021 07:04:09 GMT+0200 (Central European Summer Time)',
		supplierUrl: 'http://lura.name',
		status: ProductStatus.new,
	},
];