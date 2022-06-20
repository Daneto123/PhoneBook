const express = require('express');
const router = express.Router();
const { removeContact } = require('../database/CRUD');

const path = require('path');

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
router.route('/contacts/:id').delete((req, res) => {
		
		const Id = req.params.id;
		
		if(!Id){
			return res.status(400).sendFile(path.join(__dirname, '..', '/public/404.html'));
		}
		
		let remContact = removeContact(Id);
		remContact.then(function(result){
			if(result != null){
				return res.status(200).json(result);
			}

			return res.status(400).sendFile(path.join(__dirname, '..', '/public/404.html'));
		});
	
	
});

module.exports = router;