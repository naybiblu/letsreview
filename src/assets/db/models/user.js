const mongo = require("mongoose");

exports.model = mongo.models.user || mongo.model('user', 
    new mongo.Schema({
        username: { type: String, require: true },
        score: { type: Number, default: 0 }
    })
);