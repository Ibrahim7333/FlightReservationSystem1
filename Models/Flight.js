const mongoose = require('mongoose')
const Schema = mongoose.Schema 

const FlightSchema = new Schema({
    flightNumber: { type: String, required: true, unique: true },
    departureCity: { type: String, required: true },
    destinationCity: { type: String, required: true },
    departureDateTime: { type: Date, required: true },
    totalDuration: { type: Number, required: true }, // in hours
    stops: { type: Number, required: true },
    prices: {
      economy: { type: Number, required: true },
      business: { type: Number, required: true },
      first: { type: Number, required: true },
    },
  });

  
const flight = mongoose.model('Flight', FlightSchema);
module.exports = flight