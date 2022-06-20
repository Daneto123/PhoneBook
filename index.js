const express = require('express'); // get express function
const path = require('path'); // to join paths according to your OS (normalize)
require('dotenv').config();

const app = express(); // create application from express
const port = process.env.PORT;

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const { getContacts, getFavorites } = require('./database/CRUD');

const swaggerOptions = {
	swaggerDefinition: {
	info: {
		title: "Phonebook API",
		version: "1.0.0",
		description: "Phonebook API for webtech 2022 fmi",
	},
	servers: [ {
			url: "http://localhost:3000",
			description: "API Documentation",
		},
	],
	},
	apis: ["index.js", "./backend/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// визуализиране на начална страница със списъка с контакти
app.use(express.static(path.join(__dirname, 'public')));
app.use('/contacts', express.static(path.join(__dirname, 'public/images/upload')));
app.use('/get', require('./backend/getContact'));
app.use('/create', require('./backend/createContact'));
app.use('/remove', require('./backend/removeContact'));
app.use('/changeNumber', require('./backend/changeNumber'));
app.use('/fav', require('./backend/addFavorites'));
app.use(express.json());


/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: get all contacts.
 *     description: Get all contacts
 *     responses:
 *       200:
 *         description: Success
 * 
 */
app.get('/contacts', (req, res) => {
    
	// прочитаме данните от базата от данни
	let listContacts = getContacts();
	listContacts.then(function(result) {
		return res.status(200).json(result);
	})

    
});


/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: get all favorites contact.
 *     description: Get all favorite contacts
 *     responses:
 *       200:
 *         description: Success
 * 
 */
app.get('/favorites', (req, res) => {
    
	// прочитаме данните от базата от данни
	let listContacts = getFavorites();
	listContacts.then(function(result) {
		return res.status(200).json(result);
	})

    
});

// слушаме на порт 3000 
app.listen(port, () => { console.log(`Server listening on port ${port}`)});


module.exports = app;