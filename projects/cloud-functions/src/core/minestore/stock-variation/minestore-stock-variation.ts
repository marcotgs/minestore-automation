/* eslint-disable no-await-in-loop */
import { PuppeteerConnection } from '@core/puppeteer';
import { Product } from '@db/product';
import { logger, config } from 'firebase-functions';
import { ElementHandle, Page } from 'puppeteer';

interface MinestoreStockVariationsElements {
	btnVariations: ElementHandle<Element>[];
	variationsId: string[];
	variationsSku: string[];
}

export class MinestoreStockVariation {
	private product: Product;

	constructor(product: Product) {
		this.product = product;
	}

	async enableProductVariations({ browser }: PuppeteerConnection): Promise<any> {
		const { minestoreId } = this.product;
		const {
			minestore: { baseUrl },
		} = config().env;

		const newPage = await browser?.newPage();
		const url = `${baseUrl}/produtos/${minestoreId}`;

		await newPage?.goto(url, {
			waitUntil: 'load',
		});

		const { btnVariations, variationsId, variationsSku } = await this.queryVariationsElements(
			newPage,
		);

		let index = 0;
		// eslint-disable-next-line no-restricted-syntax
		for (const btn of btnVariations) {
			try {
				await this.openEditVariationModal(btn, newPage, variationsId[index]);

				await this.waitEditVariationModalOpen(newPage);

				const isStockDisabled = await newPage?.$eval('#product_variant_inventory_quantity', (el) =>
					el.getAttribute('disabled'),
				);

				const closeModalBtn = await newPage?.$('#modal-window .close');

				if (isStockDisabled === 'disabled') {
					const checkbox = await newPage?.$('.modal-content .block-price .checkbox');
					const btnSave = await newPage?.$('.modal-content .btn-success');

					await checkbox?.evaluate((a) => a.click(), checkbox);
					await btnSave?.click();
					await newPage?.waitForTimeout(1000);
				} else {
					closeModalBtn?.evaluate((el) => el.click(), closeModalBtn);
					await newPage?.waitForTimeout(300);
				}
			} catch (ex) {
				logger.error(
					`enableProductVariations -> Error on https://anjosdoamorsexshop.minestore.com.br/admin/produtos/${minestoreId}, sku: ${variationsSku[index]}`,
				);
			}
			index += 1;
		}
	}

	protected async queryVariationsElements(
		newPage: Page | undefined,
	): Promise<MinestoreStockVariationsElements> {
		const btnVariations =
			(await newPage?.$$(`.product-variations tbody tr .variation-actions .edit-variant`)) ?? [];

		const variationsSku =
			(await newPage?.$$eval(`.product-variations tbody tr .variation-sku`, (els) =>
				els.map((el) => el.textContent as string),
			)) ?? [];

		const variationsId =
			(await newPage?.$$eval(`.product-variations tbody tr`, (els) =>
				els.map((el) => el.getAttribute('id')?.split('variant-')[1] as string),
			)) ?? [];

		return { btnVariations, variationsId, variationsSku };
	}

	protected async waitEditVariationModalOpen(newPage: Page | undefined): Promise<void> {
		await newPage?.waitForTimeout(300);
		await newPage?.waitForSelector('#modal-window .close');
		await newPage?.waitForSelector('#product_variant_inventory_quantity');
		await newPage?.waitForSelector('.modal-content .block-price .checkbox', {
			visible: true,
		});
	}

	protected async openEditVariationModal(
		btn: ElementHandle<Element>,
		newPage: Page | undefined,
		variationId: string,
	): Promise<void> {
		try {
			await btn.click();
		} catch {
			const btnVariation = await newPage?.$(
				`#variant-${variationId} .variation-actions .edit-variant`,
			);
			await btnVariation?.evaluate((el) => el.click(), btnVariation);
		}
	}
}
