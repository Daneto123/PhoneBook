'use strict';

const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const { contactsRouter, errorHandler } = require('./contacts');
const openapi = require('./openapi');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

/** The web application, without starting it (the tests use it directly). */
function createApp(store) {
  const app = express();
  app.disable('x-powered-by');

  // API documentation (before helmet: Swagger UI needs its own scripts).
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'PhoneBook API' }));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Preview of a picture before upload uses data: and blob: URLs.
          'img-src': ["'self'", 'data:', 'blob:'],
        },
      },
    }),
  );

  // Avatars come inside the JSON, so allow a bit more than the default 100 KB.
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/contacts', contactsRouter(store));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Няма такъв адрес в API.' }));

  app.use(express.static(PUBLIC_DIR));
  app.use((req, res) => res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html')));

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
