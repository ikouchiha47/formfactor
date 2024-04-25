export class RedisQueue {
    constructor(client, queueName, keyPrefix = 'queue:') {
        this.queueName = queueName;
        this.keyPrefix = keyPrefix;
        this.client = client;
    }

    enqueue(item) {
        const key = this.getKey();
        this.client.rpush(key, item, (err, reply) => {
            if (err) {
                console.error('Error enqueuing item:', err);
            } else {
                console.log('Enqueued item:', item);
            }
        });
    }

    dequeue() {
        const key = this.getKey();
        this.client.blpop(key, 0, (err, reply) => {
            if (err) {
                console.error('Error dequeuing item:', err);
            } else {
                const [queue, item] = reply;
                console.log('Dequeued item from queue', queue, ':', item);
            }
        });
    }

    getKey() {
        return this.keyPrefix + this.queueName;
    }
}