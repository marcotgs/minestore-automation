import { ISubCollection } from 'fireorm';
import { ProductVariation, ProductVariationStatus } from '../product-variation';
import { Stock } from '../stock';

const stockStar: Partial<ISubCollection<Stock>> = {
	create: jest.fn(),
	delete: jest.fn(),
	update: jest.fn(),
	findById: jest.fn<Promise<Stock | null>, any[]>(),
};

export const mockProductVariations: ProductVariation[] = [
	{
		id: 'test',
		minestoreId: '90060',
		sku: 'test',
		quantity: 2,
		supplierUrl: 'test-url',
		status: ProductVariationStatus.available,
		createdDate: 'Mon Apr 05 2021 07:04:09 GMT+0200 (Central European Summer Time)',
		stockStar: stockStar as ISubCollection<Stock>,
	},
	{
		id: 'test1',
		minestoreId: '32171',
		sku: 'test1',
		quantity: 0,
		supplierUrl: 'test1-url',
		status: ProductVariationStatus.sold_out,
		createdDate: 'Mon Apr 05 2021 07:04:09 GMT+0200 (Central European Summer Time)',
		stockStar: stockStar as ISubCollection<Stock>,
	},
];

export const getMockedVariationsCollection = (
	variations = mockProductVariations,
): Partial<ISubCollection<ProductVariation>> => ({
	update: jest.fn(),
	create: jest.fn(),
	find: jest.fn().mockResolvedValue(variations),
	findById: jest
		.fn<Promise<ProductVariation | null>, any[]>()
		.mockImplementation((queryId) =>
			Promise.resolve(variations.find(({ id }) => queryId === id) ?? null),
		),
});
