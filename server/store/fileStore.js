'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { MemoryStore } = require('./memoryStore');

// Contacts in a JSON file: for running the project without MongoDB.
// Every change rewrites the file through a temporary file, so a crash never
// leaves it half written. Writes are queued one after another.
class FileStore extends MemoryStore {
  constructor(file) {
    super();
    this.file = file;
    this.queue = Promise.resolve();
  }

  async init() {
    let text;
    try {
      text = await fs.readFile(this.file, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return; // first start: empty phone book
      throw err;
    }
    const records = JSON.parse(text);
    for (const r of records) {
      const avatar = r.avatar ? { type: r.avatar.type, data: Buffer.from(r.avatar.data, 'base64') } : null;
      this.contacts.set(r.id, { ...r, avatar });
    }
  }

  persist() {
    const snapshot = [...this.contacts.values()].map((r) => ({
      ...r,
      avatar: r.avatar ? { type: r.avatar.type, data: r.avatar.data.toString('base64') } : null,
    }));
    const write = async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const temp = `${this.file}.tmp`;
      await fs.writeFile(temp, JSON.stringify(snapshot, null, 2));
      await fs.rename(temp, this.file);
    };
    this.queue = this.queue.then(write, write);
    return this.queue;
  }
}

module.exports = { FileStore };
