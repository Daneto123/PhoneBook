const express = require('express');
const router = express.Router();
const { getContact, getContactByPhone } = require('../database/CRUD');

const path = require('path');

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     contact:
//  *       type: object
//  *       required:
//  *         - id
//  *         - firstName
//  * 		   - lastName
//  * 		   - address
//  *         - email
//  *         - phones
//  *         - avatar
//  *       properties:
//  *         id:
//  *           type: string
//  *           description: id of contact
//  *         firstName:
//  *           type: string
//  *           description: name of contact
//  *         lastName:
//  *           type: string
//  *           description: last name of contact
//  *         address:
//  *           type: string
//  *           description: address of contact
//  *         email:
//  *           type: string
//  *           description: email of contact
//  *         phones:
//  *           type: array
//  *           description: list of number of contact 
//  * 		   avatar:
//  *           type: string
//  *           description: avatar of contact
//  *         isFavorite:
//  * 			 type: string
//  * 	         description: is contact added to favorite
//  *       example:
//  *         id: 86a32df2-ba9d-4332-8ed5-a3da3e8ef536
//  *         firstName: yourdan
//  *         lastName: pavlov
//  *         address: sofia
//  * 		   email: jordan.pavlov73@gmial.com
//  *         phones: [type: "мобилен", phone: "8909401536"]
//  *         avatar: "avatar.png"
//  *         isFavorite: true
//  */


/**
 * @swagger
 * /get/contacts/{id}:
 *   get:
 *     summary: get info for contact by id.
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
router.route('/contacts/:id').get((req, res) => {
    let id = req.params.id;
	
	if(!id){
		return res.status(400);
	}
	
	
	let contact = getContact(id);
	contact.then(function(result) {
		console.log(result);
		if(result != null){
			return res.status(200).json(result);
		}
		
		return res.status(400).sendFile(path.join(__dirname, '../', '/public/404.html'));;
	})


});



/**
 * @swagger
 * /get/contacts/{phone}:
 *   get:
 *     summary: get info for contact by phone number.
 *     parameters:
 *       - in: path
 *         name: phone
 *         schema:
 *           type: string
 *           required: true
 *         description: The contact phone number
 *     responses:
 *       200:
 *         description: The cotanct description by phone number
 *         contens:
 *           application/json:
 *       404:
 *         description: The contact was not found
 */
router.route('/contactsSearch/:phone').get((req, res) => {
    let phone = req.params.phone;
	
	if(!phone || phone.length == 0){
		return res.status(400).json({error: "Invalid parameter" });
	}

	let contactByPhone = getContactByPhone(phone);
	contactByPhone.then(function(result) {
		if(result != null){
			res.status(200).json(result);
		}
		res.status(400);
	});

});

module.exports = router;