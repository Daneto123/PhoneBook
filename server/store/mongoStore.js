'use strict';

const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({ type: String, number: String }, { _id: false });

const contactSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    phones: { type: [phoneSchema], default: [] },
    favorite: { type: Boolean, default: false, index: true },
    avatarData: { type: Buffer, select: false }, // loaded only by getAvatar()
    avatarType: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

function toRecord(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    firstName: doc.firstName,
    lastName: doc.lastName ?? '',
    email: doc.email ?? '',
    address: doc.address ?? '',
    phones: (doc.phones ?? []).map((p) => ({ type: p.type, number: p.number })),
    favorite: Boolean(doc.favorite),
    hasAvatar: Boolean(doc.avatarType),
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

// The avatar arrives as {data, type}; in MongoDB it is two fields.
function toDocument(changes) {
  const out = { ...changes };
  if ('avatar' in out) {
    out.avatarData = out.avatar ? out.avatar.data : null;
    out.avatarType = out.avatar ? out.avatar.type : null;
    delete out.avatar;
  }
  return out;
}

class MongoStore {
  constructor(uri) {
    this.uri = uri;
    this.connection = null;
    this.Contact = null;
  }

  async init() {
    // A separate connection, so tests can open and close stores freely.
    this.connection = await mongoose.createConnection(this.uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
    this.Contact = this.connection.model('Contact', contactSchema, 'contacts');
    await this.Contact.init(); // builds the indexes
  }

  async close() {
    await this.connection?.close();
  }

  async list() {
    return (await this.Contact.find().lean()).map(toRecord);
  }

  async get(id) {
    return toRecord(await this.Contact.findOne({ id }).lean());
  }

  async create(data) {
    const doc = await this.Contact.create({ ...toDocument(data), id: randomUUID() });
    return toRecord(doc);
  }

  async update(id, changes) {
    const doc = await this.Contact.findOneAndUpdate({ id }, { $set: toDocument(changes) }, { new: true }).lean();
    return toRecord(doc);
  }

  async remove(id) {
    const result = await this.Contact.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getAvatar(id) {
    const doc = await this.Contact.findOne({ id }).select('+avatarData avatarType').lean();
    if (!doc || !doc.avatarType || !doc.avatarData) return null;
    // .lean() returns a BSON Binary; turn it into a Node Buffer.
    const raw = doc.avatarData;
    const data = Buffer.isBuffer(raw) ? raw : Buffer.from(raw.buffer.subarray(0, raw.position ?? raw.buffer.length));
    return { data, type: doc.avatarType };
  }
}

module.exports = { MongoStore };
