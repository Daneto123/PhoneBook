const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

	id: {
        type: String,
        required: true
    },
	firstName: {
		type: String,
		required: true,
		match: [/^[a-z ,.'-]+$/i, 'Invalid firstName']
	},
	lastName: {
		type: String,
		required: true,
		match: [/^[a-z ,.'-]+$/i, 'Invalid lastName']
	},
    address: {
        type: String,
        required: true
    },
	email: {
		type: String,
		required: true,
		match: [/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/, 'Invalid email']
	},
	phones: {
        type: [],
        required: true,
    },
    avatar: {
        type: String,
        required: true
    },
	isFavorite: {
		type: String,
		default: false
	}
});

module.exports = mongoose.model("contact", userSchema, "contacts");