const mongoose = require('mongoose')
const Schema = mongoose.Schema 
const bcrypt = require('bcrypt')

const TicketSchema = new Schema({

  _id: mongoose.Schema.Types.ObjectId,
   
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    firstname: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})

const ticket = mongoose.model('Ticket', UserSchema)
module.exports = ticket