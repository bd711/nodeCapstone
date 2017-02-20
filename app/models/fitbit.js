//app/models/fitbit.js


const mongoose = require('mongoose');

const fitbitSchema = mongoose.Schema({
    calories: Number,
    steps: Number,
    distance: Number,
    userid: String
});

fitbitSchema.methods.apiRepr = function() {
    return {
        calories: this.calories,
        steps: this.steps,
        distance: this.distance,
    };
}

const fitbit = mongoose.model('fitbit', fitbitSchema);

module.exports = { fitbit };
