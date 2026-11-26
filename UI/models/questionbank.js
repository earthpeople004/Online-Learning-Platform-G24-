const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    course: {type: String, required: true, enum:['2620','2660','1080']}, //only 3 types of cources: 2620, 2660, 1080
    question: {type: String, required: true},
    choices: {type: Array, required: true},//4 choices
    answer: {type: String, required: true}  

});

module.exports = mongoose.model('Question',questionSchema);
