import { DateFields } from '@db/base/date-fields';

export enum StockSupplier {
	star = 'star',
}

export enum StockType {
	entry = 'ENTRY',
	out = 'OUT',
}

export class Stock extends DateFields {
	id!: string;

	quantity: number;

	type?: StockType;
}
