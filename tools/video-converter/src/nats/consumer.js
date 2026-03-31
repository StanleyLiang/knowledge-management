import { connect, JSONCodec, AckPolicy, DeliverPolicy } from 'nats';

const jc = JSONCodec();

/**
 * Create a NATS connection.
 * @param {import('../config.js').Config} config
 * @returns {Promise<import('nats').NatsConnection>}
 */
export async function createNatsConnection(config) {
  const nc = await connect({
    servers: config.natsUrl,
    name: 'video-converter-worker',
  });
  console.log(`[nats] Connected to ${config.natsUrl}`);
  return nc;
}

/**
 * Ensure the JetStream stream exists with the correct configuration.
 * @param {import('nats').NatsConnection} nc
 * @param {import('../config.js').Config} config
 */
export async function ensureStream(nc, config) {
  const jsm = await nc.jetstreamManager();

  const streamConfig = {
    name: config.natsStream,
    subjects: [config.natsSubject],
    retention: 'workqueue',
    max_age: config.streamMaxAgeSeconds * 1_000_000_000, // nanoseconds
  };

  try {
    await jsm.streams.info(config.natsStream);
    await jsm.streams.update(config.natsStream, streamConfig);
    console.log(`[nats] Stream "${config.natsStream}" updated`);
  } catch (err) {
    if (err.code === '404' || err.message?.includes('not found')) {
      await jsm.streams.add(streamConfig);
      console.log(`[nats] Stream "${config.natsStream}" created`);
    } else {
      throw err;
    }
  }
}

/**
 * Create a pull consumer and return an async iterable for messages.
 * max_ack_pending: 1 ensures one job per pod.
 * @param {import('nats').NatsConnection} nc
 * @param {import('../config.js').Config} config
 * @returns {Promise<import('nats').ConsumerMessages>}
 */
export async function createConsumer(nc, config) {
  const js = nc.jetstream();

  const consumerConfig = {
    durable_name: config.natsDurableName,
    ack_policy: AckPolicy.Explicit,
    ack_wait: config.ackWaitMs * 1_000_000, // nanoseconds
    max_ack_pending: 1,
    max_deliver: config.maxDeliver,
    deliver_policy: DeliverPolicy.All,
    filter_subject: config.natsSubject,
  };

  const jsm = await nc.jetstreamManager();

  try {
    await jsm.consumers.info(config.natsStream, config.natsDurableName);
    await jsm.consumers.update(config.natsStream, config.natsDurableName, consumerConfig);
    console.log(
      `[nats] Consumer "${config.natsDurableName}" updated on stream "${config.natsStream}"`,
    );
  } catch {
    await jsm.consumers.add(config.natsStream, consumerConfig);
    console.log(
      `[nats] Consumer "${config.natsDurableName}" created on stream "${config.natsStream}"`,
    );
  }

  const consumer = await js.consumers.get(
    config.natsStream,
    config.natsDurableName,
  );
  const messages = await consumer.consume();
  console.log(`[nats] Consuming messages from "${config.natsSubject}"`);
  return messages;
}

/**
 * Publish a job status update to NATS (core NATS, fire-and-forget).
 * @param {import('nats').NatsConnection} nc
 * @param {import('../config.js').Config} config
 * @param {object} payload - Status payload
 */
export function publishStatus(nc, config, payload) {
  try {
    const subject = `${config.natsStatusSubjectPrefix}.${payload.jobId}`;
    const data = jc.encode({
      ...payload,
      updatedAt: new Date().toISOString(),
    });

    nc.publish(subject, data);
  } catch (err) {
    console.error(`[nats] Failed to publish status: ${err.message}`);
  }
}

/**
 * Subscribe to cancel subject for a specific job.
 * Returns a subscription that should be unsubscribed when the job finishes.
 * @param {import('nats').NatsConnection} nc
 * @param {import('../config.js').Config} config
 * @param {string} jobId
 * @param {() => void} onCancel - Callback invoked when cancel is received
 * @returns {import('nats').Subscription}
 */
export function subscribeCancelSubject(nc, config, jobId, onCancel) {
  const subject = `${config.natsCancelSubjectPrefix}.${jobId}`;
  const sub = nc.subscribe(subject, { max: 1 });

  (async () => {
    for await (const msg of sub) {
      console.log(`[nats] Received cancel for job "${jobId}"`);
      onCancel();
    }
  })().catch(() => {
    // Subscription closed, ignore
  });

  return sub;
}

/**
 * Gracefully drain the NATS connection.
 * @param {import('nats').NatsConnection} nc
 */
export async function drainConnection(nc) {
  console.log('[nats] Draining connection...');
  await nc.drain();
  console.log('[nats] Connection drained');
}
