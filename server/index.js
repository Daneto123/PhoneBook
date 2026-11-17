'use strict';

// Starts the server: npm start

const path = require('node:path');
require('dotenv').config({ quiet: true });

const { createApp } = require('./app');
const { FileStore } = require('./store/fileStore');
const { MongoStore } = require('./store/mongoStore');

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'contacts.json');

async function main() {
  const uri = process.env.DBCONNECTION?.trim();
  const store = uri ? new MongoStore(uri) : new FileStore(DATA_FILE);

  try {
    await store.init();
  } catch (err) {
    console.error(uri ? `Няма връзка с MongoDB: ${err.message}` : `Файлът ${DATA_FILE} не може да се прочете: ${err.message}`);
    process.exit(1);
  }
  console.log(uri ? 'Данни: MongoDB' : `Данни: ${DATA_FILE} (без MongoDB)`);

  const server = createApp(store).listen(PORT, () => {
    console.log(`Телефонният указател работи на http://localhost:${PORT}`);
    console.log(`Документация на API: http://localhost:${PORT}/api-docs`);
  });

  const stop = () => server.close(() => store.close().finally(() => process.exit(0)));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main();
