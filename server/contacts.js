'use strict';

const express = require('express');
const {
  ValidationError,
  formatPhone,
  normalizePhone,
  parseAvatar,
  phoneSearchText,
  validateContact,
  validatePhone,
} = require('./validation');

class NotFoundError extends Error {
  constructor() {
    super('Контактът не е намерен.');
  }
}

const fullName = (c) => [c.firstName, c.lastName].filter(Boolean).join(' ');

// What the API returns: no picture bytes, phones also in a readable form.
function toPublic(c) {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    fullName: fullName(c),
    email: c.email,
    address: c.address,
    phones: c.phones.map((p) => ({ type: p.type, number: p.number, display: formatPhone(p.number) })),
    favorite: c.favorite,
    avatarUrl: c.hasAvatar ? `/api/contacts/${c.id}/avatar?v=${Date.parse(c.updatedAt)}` : null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

/** Search by name, e-mail, address or any part of a phone number. */
function matches(contact, query) {
  const q = query.trim().toLocaleLowerCase('bg');
  if (!q) return true;
  if (/^[+\d\s()./-]+$/.test(q)) {
    const digits = q.replace(/\D/g, '');
    if (digits && contact.phones.some((p) => phoneSearchText(p.number).includes(digits))) return true;
  }
  const text = [fullName(contact), contact.email, contact.address].join(' ').toLocaleLowerCase('bg');
  return text.includes(q);
}

const byName = (a, b) => fullName(a).localeCompare(fullName(b), 'bg', { sensitivity: 'base' });

function contactsRouter(store) {
  const router = express.Router();

  async function load(id) {
    const contact = await store.get(id);
    if (!contact) throw new NotFoundError();
    return contact;
  }

  router.get('/', async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const onlyFavorites = req.query.favorites === 'true' || req.query.favorites === '1';
    const list = (await store.list())
      .filter((c) => (!onlyFavorites || c.favorite) && matches(c, search))
      .sort(byName);
    res.json(list.map(toPublic));
  });

  router.post('/', async (req, res) => {
    const data = validateContact(req.body);
    data.favorite = data.favorite ?? false;
    if (req.body.avatar) data.avatar = parseAvatar(req.body.avatar);
    const created = await store.create(data);
    res.status(201).location(`/api/contacts/${created.id}`).json(toPublic(created));
  });

  router.get('/:id', async (req, res) => {
    res.json(toPublic(await load(req.params.id)));
  });

  router.patch('/:id', async (req, res) => {
    await load(req.params.id);
    const changes = validateContact(req.body, { partial: true });
    if (req.body && 'avatar' in req.body) {
      changes.avatar = req.body.avatar === null ? null : parseAvatar(req.body.avatar);
    }
    res.json(toPublic(await store.update(req.params.id, changes)));
  });

  router.delete('/:id', async (req, res) => {
    if (!(await store.remove(req.params.id))) throw new NotFoundError();
    res.status(204).end();
  });

  router.post('/:id/phones', async (req, res) => {
    const contact = await load(req.params.id);
    const phone = validatePhone(req.body);
    if (contact.phones.some((p) => p.number === phone.number)) {
      throw new ValidationError({ number: 'Този номер вече е записан.' });
    }
    if (contact.phones.length >= 10) throw new ValidationError({ number: 'Най-много 10 телефона на контакт.' });
    const updated = await store.update(contact.id, { phones: [...contact.phones, phone] });
    res.status(201).json(toPublic(updated));
  });

  router.delete('/:id/phones/:number', async (req, res) => {
    const contact = await load(req.params.id);
    const number = normalizePhone(req.params.number) ?? req.params.number;
    const phones = contact.phones.filter((p) => p.number !== number);
    if (phones.length === contact.phones.length) {
      return res.status(404).json({ error: 'Този номер не е на контакта.' });
    }
    if (phones.length === 0) {
      throw new ValidationError({ number: 'Контактът трябва да има поне един телефон.' });
    }
    res.json(toPublic(await store.update(contact.id, { phones })));
  });

  router.get('/:id/avatar', async (req, res) => {
    const avatar = await store.getAvatar(req.params.id);
    if (!avatar) return res.status(404).json({ error: 'Няма снимка.' });
    res.set('Cache-Control', 'public, max-age=31536000, immutable'); // the URL changes with every edit
    res.type(avatar.type).send(avatar.data);
  });

  return router;
}

// Turns errors into JSON answers with the right status code.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message, fields: err.fields });
  if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Данните са твърде големи.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Невалиден JSON.' });
  console.error(err);
  return res.status(500).json({ error: 'Грешка в сървъра. Опитайте пак.' });
}

module.exports = { contactsRouter, errorHandler, matches, toPublic };
