import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';
import { Product } from '@db/products';

const projectId = 'minestore-automation';
admin.initializeApp();
const db = admin.firestore();
// const pubsub = new PubSub({ projectId });
// const [topic] = await pubsub.createTopic(topicName);

async function getProductsDb(): Promise<Product[]> {
	const productsSnapshot = await db.collection('products').get();
	return productsSnapshot.docs.map((doc) => ({
		...(doc.data() as Product),
		id: doc.id,
	}));
}

export const scheduledGetProducts = functions
	.region('southamerica-east1')
	.pubsub.schedule('* * * * *')
	.timeZone('America/Sao_Paulo')
	.onRun(async (context) => {
		functions.logger.info(`get products - ${context.timestamp}`, {
			structuredData: true,
		});
		await getProductsDb();
	});

export const getProducts = functions.https.onRequest(async (_req, res) => {
	const data = await getProductsDb();
	res.json(data);
});
