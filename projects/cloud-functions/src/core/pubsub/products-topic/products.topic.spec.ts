import { PubSub, Topic } from '@google-cloud/pubsub';

import { productsMocks } from '@db/product/__mocks__/products.mock';
import { MinestoreAuthMock } from '@core/minestore/auth/__mocks__/minestore-auth.mock';
import { MinestoreSessionData } from '@core/minestore/auth';
import { ProductsTopic } from './products.topic';

jest.mock('@google-cloud/pubsub');

describe('products.topic', () => {
	const minestoreAuthMock = new MinestoreAuthMock();
	let mockSession: MinestoreSessionData;
	let productsTopic: ProductsTopic;
	const topicName = 'products';
	const projectId = 'test';
	const mockTopic = new Topic(new PubSub({ projectId }), 'test');
	const topicJsonSpy = jest
		.spyOn(Topic.prototype, 'publishJSON')
		.mockImplementation(() => Promise.resolve());

	beforeEach(async () => {
		mockSession = await minestoreAuthMock.loginOnce();
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
		jest.spyOn(PubSub.prototype, 'createTopic').mockImplementation(() => Promise.reject());

		const topicSpy = jest.spyOn(PubSub.prototype, 'topic').mockImplementation(() => mockTopic);

		await productsTopic.create();

		expect(topicSpy).toBeCalledWith(topicName);
	});

	test('should publish items to the topic', async () => {
		(productsTopic as any).topic = mockTopic;

		await productsTopic.publish(productsMocks);

		expect(topicJsonSpy).toBeCalledTimes(2);
		expect(topicJsonSpy.mock.calls).toEqual(
			productsMocks.map(({ id }) => [
				{
					id,
					data: {},
				},
			]),
		);
	});

	test('should publish items with extra data to the topic', async () => {
		(productsTopic as any).topic = mockTopic;

		await productsTopic.publish(productsMocks, mockSession);

		expect(topicJsonSpy).toBeCalledTimes(2);
		expect(topicJsonSpy.mock.calls).toEqual(
			productsMocks.map(({ id }) => [
				{
					id,
					data: mockSession,
				},
			]),
		);
	});
});
