const mongoose = require('mongoose')
const Schema = mongoose.Schema 
const bcrypt = require('bcrypt')

const UserSchema = new Schema({
  email: {type: String, required: true, lowercase: true, unique: true},
  fullname: {type: String, required: true},
  username: {type: String, required: true, unique: true},
  password: { type: String, required: true },
  isAdmin: { type: Boolean, required: true }
});

UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password)
  } catch (error) {
    throw error
  }
}

const user = mongoose.model('User', UserSchema)
module.exports = user