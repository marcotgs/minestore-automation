import * as functions from 'firebase-functions';
import { productRepository } from '../db/products';

// admin.initializeApp();
// const firestore = admin.firestore();

// async function getProductsDb(): Promise<any[]> {
// 	const productsSnapshot = await firestore.collection('products').get();
// 	return productsSnapshot.docs.map((doc) => ({
// 		...doc.data(),
// 		id: doc.id,
// 	}));
// }

export const scheduledGetProducts = functions
	.region('southamerica-east1')
	.pubsub.schedule('* * * * *')
	.timeZone('America/Sao_Paulo')
	.onRun(async (context) => {
		functions.logger.info(`get products - ${context.timestamp}`, {
			structuredData: true,
		});
		// await getProductsDb();
	});

export const getProducts = functions.https.onRequest(async (_req, res) => {
	const data = await productRepository.findById('8C3405K7bkM6vDxw3LNK');
	res.json(data);
});
