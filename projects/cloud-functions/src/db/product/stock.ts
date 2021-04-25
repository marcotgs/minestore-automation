export enum StockSupplier {
	star = 'star',
}

export enum StockType {
	entry = 'ENTRY',
	out = 'OUT',
}

export class Stock {
	id!: string;

	date: string;

	quantity: number;

	type?: StockType;
}
