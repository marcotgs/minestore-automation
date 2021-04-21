export enum StockType {
	entry = 'ENTRY',
	out = 'OUT',
}

export class Stock {
	id!: string;

	date!: string;

	quantity!: string;

	type!: StockType;
}
