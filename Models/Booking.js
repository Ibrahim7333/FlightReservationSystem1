const mongoose = require('mongoose')
const Schema = mongoose.Schema 

const BookingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    flightNumber: { type: String, required: true },
    fareType: { type: String, enum: ['economy', 'business', 'first'], required: true },
    luggageWeight: { type: Number, required: true },
    finalFare: { type: Number, required: true },
    seatNumber: { type: String, required: true },
    aircraftModel: { type: String, required: true },
    flightDateTime: { type: Date, required: true },
  });

const booking = mongoose.model('Booking', BookingSchema);
module.exports = booking