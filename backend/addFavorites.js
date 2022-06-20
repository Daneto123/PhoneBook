const express = require('express');
const router = express.Router();

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

const path = require('path');

const { addtoFavorite } = require('../database/CRUD');


/**
 * @swagger
 * /fav/favorite/{id}:
 *   patch:
 *     summary: add contact to favorites by id.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           required: true
 *         description: The contact id
 *     responses:
 *       200:
 *         description: The cotanct description by id
 *         contens:
 *           application/json:
 *       404:
 *         description: The contact was not found
 */
router.route('/favorite/:id').patch(jsonParser, (req, res) => {

	let Id = req.params.id;
	let isFav = req.body.isFav;
	
	if(!Id || !isFav){
		return res.status(400).sendFile(path.join(__dirname, '..', '/public/404.html'));
	}

	const result = addtoFavorite(Id, isFav);
	if(result == 5){
		return res.send(400).sendFile(path.join(__dirname, '..', '/public/404.html'));
	}

	return res.send(200);
});

module.exports = router;