const express = require('express');
const router = express.Router();

const multer = require("multer");
const Uuid = require('uuid');
const { createContact } = require('../database/CRUD');
var userModel = require('../database/models/Contact');
const path = require('path');

// настроики на multer
var storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, './public/images/upload/');
	},
	filename: function(req, file, callback) {
		callback(null, file.originalname);
	}

});

var upload = multer({ storage: storage });

/**
* @swagger
* paths:
*  /create/contacts:
*    post:
*      summary: add new contact.
*      parameters:
*        - in: formData
*          name: firstName
*          type: string
*          description: A contact's first name.
*        - in: formData
*          name: lastName
*          type: number
*          description: A contact's last name.
*        - in: formData
*          name: address
*          type: number
*          description: A contact's address.
*        - in: formData
*          name: email
*          type: number
*          description: A contact's email.
*        - in: formData
*          name: phone
*          type: number
*          description: A contact's phone number.
*        - in: formData
*          name: avatar
*          type: number
*          description: A contact's avatar.
*      responses:
*        200:
*          description: OK
*/
router.route('/contacts').post(upload.single('uploaded_file'), (req, res, next) => {
		const email = req.body.email;
		const phone = req.body.phone;

		const emailRegex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
		const phoneRegex = /^(\d{9})*$/;

		if(email.match(emailRegex) && phone.match(phoneRegex)){
			next();
		}   

		// res.status(400).sendFile(path.join(__dirname, '..', '/public/404.html'));
	}, (req, res) => {

		const firstName = req.body.firstname;
		const lastName = req.body.lastname;
		const address = req.body.address;
		const email = req.body.email;
		const phone = req.body.phone;
		let avatar;

		if(!req.file) {
			avatar = "unknown-person-icon.jpg";
		} else {
			avatar = req.file.filename;
		}


		if(!firstName || !lastName || !address || !email || !phone || !avatar) {
			return res.status(404).sendFile(path.join(__dirname, '..', '/public/404.html'));
		}

		let Id = Uuid.v4();

		const phoneNumber = {
			"type": "мобилен",
			"phone": phone
		}

		const newContact = new userModel({
			id: Id,
			firstName: firstName,
			lastName: lastName,
			address: address,
			email: email,
			phones: [phoneNumber],
			avatar: avatar,
			isFavorites: false
		});

		// console.log(req.file.filename, req.body);
		const result = createContact(newContact);
		if(result == 4) {
			return res.sendFile(path.join(__dirname, '..', '/public/404.html'));
		}

	
});

module.exports = router;