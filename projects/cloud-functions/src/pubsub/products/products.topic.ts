import { Product } from '@db/product';
import { PubSub, Topic } from '@google-cloud/pubsub';

export class ProductsTopic {
	private topic!: Topic;

	private pubsub: PubSub;

	public topicName = 'products';

	constructor() {
		const { projectId } = process.env.FIREBASE_CONFIG as any;
		this.pubsub = new PubSub({ projectId });
	}

	public async create(): Promise<void> {
		try {
			const [topic] = await this.pubsub.createTopic(this.topicName);
			this.topic = topic;
		} catch (ex) {
			this.topic = this.pubsub.topic(this.topicName);
		}
	}

	public async publish(products: Product[]): Promise<void> {
		const publishPromises = products.map((product) => this.topic.publishJSON({ id: product.id }));
		await Promise.all(publishPromises);
	}
}
