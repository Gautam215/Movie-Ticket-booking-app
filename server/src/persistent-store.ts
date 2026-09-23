import { MongoClient, type Collection } from 'mongodb';
import { MemoryStore, type StoreSnapshot } from './store.js';

const STATE_ID = 'eventra-current';

type StoreDocument = {
  key: string;
  snapshot: StoreSnapshot;
  updatedAt: Date;
};

export class PersistentStore extends MemoryStore {
  readonly persistence = 'mongodb';
  private writeQueue = Promise.resolve();

  private constructor(
    private readonly client: MongoClient,
    private readonly collection: Collection<StoreDocument>,
  ) {
    super();
    this.setChangeListener(() => this.schedulePersist());
  }

  static async create(uri: string): Promise<PersistentStore> {
    const client = new MongoClient(uri);
    await client.connect();
    const collection = client.db().collection<StoreDocument>('eventra_state');
    const store = new PersistentStore(client, collection);
    const existing = await collection.findOne({ key: STATE_ID });
    if (existing) {
      store.restore(existing.snapshot);
    } else {
      await store.persist();
    }
    return store;
  }

  async close(): Promise<void> {
    await this.writeQueue;
    await this.client.close();
  }

  private schedulePersist(): void {
    this.writeQueue = this.writeQueue
      .then(() => this.persist())
      .catch(error => console.error('MongoDB persistence failed', error));
  }

  private async persist(): Promise<void> {
    await this.collection.replaceOne(
      { key: STATE_ID },
      { key: STATE_ID, snapshot: this.createSnapshot(), updatedAt: new Date() },
      { upsert: true },
    );
  }
}
