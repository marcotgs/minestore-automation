import { Collection, getRepository, ISubCollection, SubCollection } from 'fireorm';

import { DateFields } from '@db/base/date-fields';
import { ProductVariation } from '@db/product-variation';

@Collection('products')
export class Product extends DateFields {
	id!: string;

	minestoreId: string;

	name: string;

	images?: string[];

	@SubCollection(ProductVariation, 'variations')
	variations?: ISubCollection<ProductVariation>;
}

export const productRepository = getRepository(Product);
