import { Request } from 'firebase-functions';

import { getProducts, scheduledGetProducts } from './getProducts';
import { Product, productRepository, ProductStatus } from '../db/products';

jest.mock('../db/products');

describe('getProducts', () => {
	const req = { body: {} } as Request;
	const res: any = { json: jest.fn() };
	const mockProducts: Product[] = [
		{
			id: 'a729d75e-fd8c-48ae-917a-c4fa6c33401d',
			name: 'Fantastic Plastic Car',
			minestore_id: '93564',
			created_date:
				'Thu Apr 08 2021 23:09:53 GMT+0200 (Central European Summer Time)',
			status: ProductStatus.new,
			supplier_url: 'https://lulu.name',
		},
	];

	beforeAll(() => {
		productRepository.find = jest
			.fn<Promise<Product[]>, any[]>()
			.mockImplementation(() => Promise.resolve(mockProducts));
	});

	test('should get products array from database in the scheduled function', async () => {
		scheduledGetProducts({}, {});
		expect(productRepository.find).toBeCalledWith();
	});

	test('should get products array from database', async () => {
		await getProducts(req, res);
		expect(res.json).toBeCalledWith(mockProducts);
	});
});
