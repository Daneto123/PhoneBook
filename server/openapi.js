'use strict';

// API documentation, shown at /api-docs.

const phone = {
  type: 'object',
  properties: {
    type: { type: 'string', example: 'мобилен' },
    number: { type: 'string', example: '+359888123456', description: 'Приема и 0888 123 456, 00359…' },
    display: { type: 'string', readOnly: true, example: '0888 123 456' },
  },
  required: ['number'],
};

const contactInput = {
  type: 'object',
  properties: {
    firstName: { type: 'string', example: 'Йордан' },
    lastName: { type: 'string', example: 'Павлов' },
    email: { type: 'string', example: 'yordan@example.com' },
    address: { type: 'string', example: 'София' },
    phones: { type: 'array', items: phone },
    favorite: { type: 'boolean' },
    avatar: {
      type: 'string',
      nullable: true,
      description: 'data:image/jpeg;base64,… (JPEG, PNG или WebP, до 300 KB); null изтрива снимката',
    },
  },
};

const contact = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    fullName: { type: 'string' },
    email: { type: 'string' },
    address: { type: 'string' },
    phones: { type: 'array', items: phone },
    favorite: { type: 'boolean' },
    avatarUrl: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const error = {
  type: 'object',
  properties: {
    error: { type: 'string', example: 'Невалиден телефонен номер.' },
    fields: { type: 'object', additionalProperties: { type: 'string' } },
  },
};

const json = (schema) => ({ content: { 'application/json': { schema } } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string' } };
const notFound = { description: 'Няма такъв контакт', ...json(ref('Error')) };
const invalid = { description: 'Невалидни данни', ...json(ref('Error')) };

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'PhoneBook API',
    version: '2.0.0',
    description: 'Телефонен указател (Уеб технологии, ФМИ 2022)',
  },
  paths: {
    '/api/contacts': {
      get: {
        summary: 'Всички контакти (по азбучен ред)',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Име, имейл, адрес или част от номер' },
          { name: 'favorites', in: 'query', schema: { type: 'boolean' }, description: 'Само любимите' },
        ],
        responses: { 200: { description: 'Списък', ...json({ type: 'array', items: ref('Contact') }) } },
      },
      post: {
        summary: 'Нов контакт',
        requestBody: { required: true, ...json(ref('ContactInput')) },
        responses: { 201: { description: 'Създаден', ...json(ref('Contact')) }, 400: invalid },
      },
    },
    '/api/contacts/{id}': {
      parameters: [idParam],
      get: { summary: 'Един контакт', responses: { 200: { description: 'Контакт', ...json(ref('Contact')) }, 404: notFound } },
      patch: {
        summary: 'Промяна (само изпратените полета), вкл. любим и снимка',
        requestBody: { required: true, ...json(ref('ContactInput')) },
        responses: { 200: { description: 'Променен', ...json(ref('Contact')) }, 400: invalid, 404: notFound },
      },
      delete: { summary: 'Изтриване', responses: { 204: { description: 'Изтрит' }, 404: notFound } },
    },
    '/api/contacts/{id}/phones': {
      parameters: [idParam],
      post: {
        summary: 'Добавя телефон',
        requestBody: { required: true, ...json(phone) },
        responses: { 201: { description: 'Добавен', ...json(ref('Contact')) }, 400: invalid, 404: notFound },
      },
    },
    '/api/contacts/{id}/phones/{number}': {
      parameters: [idParam, { name: 'number', in: 'path', required: true, schema: { type: 'string' } }],
      delete: {
        summary: 'Премахва телефон (последният не може)',
        responses: { 200: { description: 'Премахнат', ...json(ref('Contact')) }, 400: invalid, 404: notFound },
      },
    },
    '/api/contacts/{id}/avatar': {
      parameters: [idParam],
      get: {
        summary: 'Снимката на контакта',
        responses: { 200: { description: 'Изображение', content: { 'image/*': {} } }, 404: notFound },
      },
    },
  },
  components: { schemas: { Contact: contact, ContactInput: contactInput, Error: error } },
};
