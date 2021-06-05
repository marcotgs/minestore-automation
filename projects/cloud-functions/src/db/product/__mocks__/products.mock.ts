import { ISubCollection } from 'fireorm';

import { Product } from '@db/product';
import { ProductVariation } from '@db/product-variation';
import {
	getMockedVariationsCollection,
	mockProductVariations,
} from '@db/product-variation/__mocks__/product-variations.mock';

export const productsMocks: Product[] = [
	{
		id: 'test2',
		minestoreId: 'steel-bike',
		name: 'Sleek Steel Bike',
		createdDate: 'Mon Apr 05 2021 07:04:09 GMT+0200 (Central European Summer Time)',
		variations: getMockedVariationsCollection() as ISubCollection<ProductVariation>,
	},
	{
		id: 'test2',
		minestoreId: 'sleek-wooden-soap',
		name: 'Sleek Wooden Soap',
		createdDate: 'Mon Apr 05 2021 07:04:09 GMT+0200 (Central European Summer Time)',
		variations: getMockedVariationsCollection([
			mockProductVariations[0],
		]) as ISubCollection<ProductVariation>,
	},
];
