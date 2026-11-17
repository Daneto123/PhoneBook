'use strict';

// The whole API against an in-memory store (and MongoDB when MONGO_URL is set,
// as in GitHub Actions). No external services are needed by default.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

const { createApp } = require('../server/app');
const { MemoryStore } = require('../server/store/memoryStore');
const { FileStore } = require('../server/store/fileStore');
const { MongoStore } = require('../server/store/mongoStore');

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082',
  'hex',
);
const avatar = `data:image/png;base64,${PNG.toString('base64')}`;

const ivan = { firstName: 'Иван', lastName: 'Петров', email: 'ivan@example.com', address: 'Пловдив', phones: [{ type: 'мобилен', number: '0888 123 456' }] };
const ana = { firstName: 'Ана', lastName: 'Георгиева', phones: [{ number: '+359 2 987 6543', type: 'домашен' }] };

const stores = [['memory', () => new MemoryStore()]];
if (process.env.MONGO_URL) stores.push(['mongodb', () => new MongoStore(process.env.MONGO_URL)]);

for (const [name, makeStore] of stores) {
  test(`API (${name})`, async (t) => {
    const store = makeStore();
    await store.init();
    if (store.Contact) await store.Contact.deleteMany({});
    const app = createApp(store);
    t.after(() => store.close());

    let ivanId;

    await t.test('creates a contact (Cyrillic, any phone format, picture)', async () => {
      const res = await request(app).post('/api/contacts').send({ ...ivan, avatar }).expect(201);
      ivanId = res.body.id;
      assert.match(ivanId, /^[0-9a-f-]{36}$/);
      assert.equal(res.headers.location, `/api/contacts/${ivanId}`);
      assert.equal(res.body.fullName, 'Иван Петров');
      assert.deepEqual(res.body.phones, [{ type: 'мобилен', number: '+359888123456', display: '0888 123 456' }]);
      assert.equal(res.body.favorite, false);
      assert.match(res.body.avatarUrl, new RegExp(`^/api/contacts/${ivanId}/avatar\\?v=\\d+$`));
      await request(app).post('/api/contacts').send(ana).expect(201);
    });

    await t.test('returns field errors instead of hanging', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ firstName: 'R2D2', email: 'x', phones: [{ number: 'abc' }] })
        .expect(400);
      assert.ok(res.body.error);
      assert.deepEqual(Object.keys(res.body.fields).sort(), ['email', 'firstName', 'phones.0']);

      const bad = await request(app).post('/api/contacts').set('Content-Type', 'application/json').send('{"oops').expect(400);
      assert.equal(bad.body.error, 'Невалиден JSON.');

      const fake = Buffer.from('<script>alert(1)</script>'.repeat(4)).toString('base64');
      const notImage = await request(app).post('/api/contacts').send({ ...ana, firstName: 'Хакер', avatar: `data:image/png;base64,${fake}` }).expect(400);
      assert.ok(notImage.body.fields.avatar);

      const huge = 'x'.repeat(2 * 1024 * 1024);
      await request(app).post('/api/contacts').send({ ...ana, address: huge }).expect(413);
    });

    await t.test('lists alphabetically and searches by name, e-mail or phone', async () => {
      const all = (await request(app).get('/api/contacts').expect(200)).body;
      assert.deepEqual(all.map((c) => c.fullName), ['Ана Георгиева', 'Иван Петров']);

      const search = async (q) => (await request(app).get('/api/contacts').query({ search: q })).body.map((c) => c.firstName);
      assert.deepEqual(await search('иван'), ['Иван']); // case does not matter
      assert.deepEqual(await search('ПЕТР'), ['Иван']);
      assert.deepEqual(await search('0888'), ['Иван']); // national format
      assert.deepEqual(await search('359888'), ['Иван']); // international
      assert.deepEqual(await search('987 65'), ['Ана']);
      assert.deepEqual(await search('example.com'), ['Иван']);
      assert.deepEqual(await search('пловдив'), ['Иван']);
      assert.deepEqual(await search('няма такъв'), []);
    });

    await t.test('favorites work', async () => {
      const res = await request(app).patch(`/api/contacts/${ivanId}`).send({ favorite: true }).expect(200);
      assert.equal(res.body.favorite, true);
      const favs = (await request(app).get('/api/contacts?favorites=true').expect(200)).body;
      assert.deepEqual(favs.map((c) => c.firstName), ['Иван']);
      await request(app).patch(`/api/contacts/${ivanId}`).send({ favorite: 'yes' }).expect(400);
    });

    await t.test('edits only the fields that are sent', async () => {
      const res = await request(app).patch(`/api/contacts/${ivanId}`).send({ address: 'София', lastName: 'Иванов' }).expect(200);
      assert.equal(res.body.address, 'София');
      assert.equal(res.body.lastName, 'Иванов');
      assert.equal(res.body.email, 'ivan@example.com');
      assert.equal(res.body.favorite, true);
      await request(app).patch(`/api/contacts/${ivanId}`).send({ firstName: '' }).expect(400);
    });

    await t.test('adds and removes phone numbers', async () => {
      let res = await request(app).post(`/api/contacts/${ivanId}/phones`).send({ type: 'служебен', number: '02 123 4567' }).expect(201);
      assert.deepEqual(res.body.phones.map((p) => p.display), ['0888 123 456', '02 123 4567']);

      res = await request(app).post(`/api/contacts/${ivanId}/phones`).send({ number: '+359888123456' }).expect(400);
      assert.match(res.body.fields.number, /вече е записан/);
      await request(app).post(`/api/contacts/${ivanId}/phones`).send({ number: 'нула' }).expect(400);

      // Any format of the number removes it.
      res = await request(app).delete(`/api/contacts/${ivanId}/phones/${encodeURIComponent('0888 123 456')}`).expect(200);
      assert.deepEqual(res.body.phones.map((p) => p.number), ['+35921234567']);
      await request(app).delete(`/api/contacts/${ivanId}/phones/0888123456`).expect(404);
      // The last number stays.
      res = await request(app).delete(`/api/contacts/${ivanId}/phones/%2B35921234567`).expect(400);
      assert.match(res.body.error, /поне един телефон/);
    });

    await t.test('serves, replaces and removes the picture', async () => {
      const contact = (await request(app).get(`/api/contacts/${ivanId}`).expect(200)).body;
      const img = await request(app).get(contact.avatarUrl).expect(200);
      assert.equal(img.headers['content-type'], 'image/png');
      assert.ok(Buffer.compare(img.body, PNG) === 0);

      const removed = (await request(app).patch(`/api/contacts/${ivanId}`).send({ avatar: null }).expect(200)).body;
      assert.equal(removed.avatarUrl, null);
      await request(app).get(`/api/contacts/${ivanId}/avatar`).expect(404);
    });

    await t.test('unknown ids and addresses give 404 JSON', async () => {
      await request(app).get('/api/contacts/no-such-id').expect(404);
      await request(app).patch('/api/contacts/no-such-id').send({ favorite: true }).expect(404);
      await request(app).delete('/api/contacts/no-such-id').expect(404);
      await request(app).post('/api/contacts/no-such-id/phones').send({ number: '112' }).expect(404);
      const res = await request(app).get('/api/nothing').expect(404);
      assert.ok(res.body.error);
    });

    await t.test('deletes a contact', async () => {
      await request(app).delete(`/api/contacts/${ivanId}`).expect(204);
      await request(app).get(`/api/contacts/${ivanId}`).expect(404);
      const all = (await request(app).get('/api/contacts')).body;
      assert.deepEqual(all.map((c) => c.firstName), ['Ана']);
    });
  });
}

test('the web page, docs and security headers are served', async () => {
  const app = createApp(new MemoryStore());
  const page = await request(app).get('/').expect(200);
  assert.match(page.text, /<title>/);
  assert.ok(page.headers['content-security-policy']);
  assert.equal(page.headers['x-powered-by'], undefined);
  await request(app).get('/api-docs/').expect(200);
  await request(app).get('/no-such-page').expect(404).expect('Content-Type', /html/);
});

test('the file store keeps contacts (and pictures) between restarts', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'phonebook-'));
  const file = path.join(dir, 'sub', 'contacts.json');
  try {
    const first = new FileStore(file);
    await first.init();
    const app1 = createApp(first);
    const created = (await request(app1).post('/api/contacts').send({ ...ivan, avatar }).expect(201)).body;
    await request(app1).patch(`/api/contacts/${created.id}`).send({ favorite: true }).expect(200);
    assert.ok(!fs.existsSync(`${file}.tmp`));

    const second = new FileStore(file);
    await second.init();
    const app2 = createApp(second);
    const loaded = (await request(app2).get(`/api/contacts/${created.id}`).expect(200)).body;
    assert.equal(loaded.fullName, 'Иван Петров');
    assert.equal(loaded.favorite, true);
    const img = await request(app2).get(loaded.avatarUrl).expect(200);
    assert.ok(Buffer.compare(img.body, PNG) === 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
