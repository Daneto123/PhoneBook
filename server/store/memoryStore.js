'use strict';

const { randomUUID } = require('node:crypto');

// Contacts kept in memory. Used by the tests and as the base of the file store.
//
// A record: { id, firstName, lastName, email, address, phones: [{type, number}],
//             favorite, avatar: {data: Buffer, type} | null, createdAt, updatedAt }
// Records handed out never contain the picture bytes, only `hasAvatar`.

function withoutAvatar(record) {
  const { avatar, ...rest } = record;
  return structuredClone({ ...rest, hasAvatar: Boolean(avatar) });
}

class MemoryStore {
  constructor() {
    this.contacts = new Map();
  }

  async init() {}

  async close() {}

  async list() {
    return [...this.contacts.values()].map(withoutAvatar);
  }

  async get(id) {
    const record = this.contacts.get(id);
    return record ? withoutAvatar(record) : null;
  }

  async create(data) {
    const now = new Date().toISOString();
    const record = {
      id: randomUUID(),
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      phones: [],
      favorite: false,
      avatar: null,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.contacts.set(record.id, record);
    await this.persist();
    return withoutAvatar(record);
  }

  async update(id, changes) {
    const record = this.contacts.get(id);
    if (!record) return null;
    Object.assign(record, changes, { updatedAt: new Date().toISOString() });
    await this.persist();
    return withoutAvatar(record);
  }

  async remove(id) {
    const existed = this.contacts.delete(id);
    if (existed) await this.persist();
    return existed;
  }

  async getAvatar(id) {
    return this.contacts.get(id)?.avatar ?? null;
  }

  // Overridden by the file store.
  async persist() {}
}

module.exports = { MemoryStore, withoutAvatar };
