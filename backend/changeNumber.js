const express = require('express');
const router = express.Router();

const { addNewPhoneNumber, removePhoneNumber } = require('../database/CRUD');

const path = require('path');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

// /**
//  * @swagger
//  * /changeNumber/contactsPhone/{id}:
//  *   patch:
//  *     summary: add another phone number to contact by id.
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *           required: true
//  *           description: The contact id
//  *       - in: body
//  *            name: phone
//  *            schema:
//  *               type: '#/definitions/Phone'
//  *     responses:
//  *       200:
//  *         description: The cotanct description by id
//  *  definitions:
//  *     Phone:
//  *       type: object
//  *     properties:
//  *       typePhone:
//  *          type: string
//  *       phone:
//  *          type: string
//  */

router.route('/contactsPhone/:id').patch(jsonParser, (req, res, next) => {
		const phone = req.body.phone;

		let Id = req.params.id;

		let newNum = {
			"type": req.body.type,
			"phone": req.body.phone
		}

		const phoneRegex = /^(\d{9})*$/;

		if(phone.match(phoneRegex)){
			next();
		}

		console.log(req.body.phone);
		console.log(req.body.type);

		return res.sendFile(path.join(__dirname, '../', '/public/404.html'));
		
	}, (req, res) => {

		let Id = req.params.id;
		// console.log("da" + req.body);
		let typeNum = req.body.type;
		let	anotherPhoneNum = req.body.phone;
		
		if(!Id || !typeNum || !anotherPhoneNum){
			return res.status(400);
		}

		let newNum = {
			"type": typeNum,
			"phone": anotherPhoneNum
		}

		const result = addNewPhoneNumber(Id, newNum);
		if(result == 5){
			return res.status(400).sendFile(path.join(__dirname, '../', '/public/404.html'));
		}

		return res.status(200);
});



/**
 * @swagger
 * /remove/contacts/{id}:
 *   delete:
 *     summary: remove contact by id.
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
router.route('/contactsPhone/:id').delete(jsonParser, (req, res, next) => {
		const phone = req.body.phone;

		const phoneRegex = /^(\d{9})*$/;

		if(phone.match(phoneRegex)){
			next();
		}

		res.status(400).sendFile(path.join(__dirname, '../', '/public/404.html'));
	}, (req, res) => {

		let Id = req.params.id;
		let anotherPhoneNum = req.body.phone;
		
		if(!Id || !anotherPhoneNum){
			return res.status(400).sendFile(path.join(__dirname, '../', '/public/404.html'));
		}
		
		const result = removePhoneNumber(Id, anotherPhoneNum);

		if(result == 5){
			return res.status(400).sendFile(path.join(__dirname, '../', '/public/404.html'));
		}

		return res.status(200);

});

module.exports = router;