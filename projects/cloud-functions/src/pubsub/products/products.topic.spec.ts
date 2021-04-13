import { Product } from '@db/products';
import { productsMocks } from '@db/__mocks__/products.mocks';
import { PubSub, Topic } from '@google-cloud/pubsub';
import { ProductsTopic } from './products.topic';

jest.mock('@google-cloud/pubsub');

describe('products.topic', () => {
	let productsTopic: ProductsTopic;
	const topicName = 'products';
	const projectId = 'test';
	const mockTopic = new Topic(new PubSub({ projectId }), 'test');

	beforeEach(() => {
		process.env = {
			FIREBASE_CONFIG: { projectId } as any,
		};
		productsTopic = new ProductsTopic();
	});

	test('should create pubsub client', () => {
		expect(PubSub).toBeCalledWith({ projectId });
	});

	test('should create topic', async () => {
		const createTopicSpy = jest
			.spyOn(PubSub.prototype, 'createTopic')
			.mockImplementation(() => Promise.resolve([mockTopic]));

		await productsTopic.create();

		expect(createTopicSpy).toBeCalledWith(topicName);
	});

	test('should get topic when topic is already created', async () => {
		jest
			.spyOn(PubSub.prototype, 'createTopic')
			.mockImplementation(() => Promise.reject());

		const topicSpy = jest
			.spyOn(PubSub.prototype, 'topic')
			.mockImplementation(() => mockTopic);

		await productsTopic.create();

		expect(topicSpy).toBeCalledWith(topicName);
	});

	test('should publish items to the topic', async () => {
		(productsTopic as any).topic = mockTopic;

		const topicJsonSpy = jest
			.spyOn(Topic.prototype, 'publishJSON')
			.mockImplementation(() => Promise.resolve());

		await productsTopic.publish(productsMocks);

		expect(topicJsonSpy).toBeCalledTimes(2);
		expect(topicJsonSpy.mock.calls).toEqual(
			productsMocks.map(({ id }) => [
				{
					id,
				},
			]),
		);
	});
});
