var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var debug = false;

// In production
if(!debug){
    mongoose.connect('mongodb://nodeUser:JgKwWLVBYUy2RA8pKRYTg9rN7idRcbYnaGph2Ur@localhost:27314/rsvp')
}else{
    mongoose.connect('mongodb://localhost/bryllup');
}

var UserAccount = new Schema({
    user_name       : { type: String, required: true, lowercase: true, trim: true, index: { unique: true } },
    password        : { type: String, required: true },
    date_created    : { type: Date, required: true, default: Date.now }
});

var Product = new Schema({
    upc             : { type: String, required: true, index: { unique: true } },
    description     : { type: String, trim: true },
    size_weight     : { type: String, trim: true }
});