const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    role: {type: String, required: true, enum:['teacher','student']}, //Can only be student or teacher
    username: {type: String, required: true},// Used for login
    password: {type: String, required: true}, //Used for login
    courses: Array, //Users can only access to the courses they have
    score: {type: Map, of: String} //Not required if role = teacher //Dictionary

});

module.exports = mongoose.model('User', userSchema);