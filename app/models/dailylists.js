//app/models/dailylist.


const mongoose = require('mongoose');

const dailylistSchema = mongoose.Schema({
    date: { type: Date, default: Date.now },
    userid: String,
    symptoms: [String],
});

dailylistSchema.methods.apiRepr = function() {
    return {
        date: this.date,
        userid: this.user._id,
        id: this.id,
        symptoms: this.symptoms
    };
}

const dailylist = mongoose.model('dailylist', dailylistSchema);

module.exports = { dailylist };
