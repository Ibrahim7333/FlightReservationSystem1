const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const Flight = require('../Models/Flight');
const Booking = require('../Models/Booking');
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../Helpers/JwtHelper')

// Middleware to check if a user is an admin
const isAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    next(); // User is an admin, continue
  } else {
    next(createError(403, 'Access denied. Admin privileges required.'));
  }
};

// Middleware to check if a user is a regular user
const isUser = (req, res, next) => {
  if (!req.user.isAdmin) {
    next(); // User is a regular user, continue
  } else {
    next(createError(403, 'Access denied. Regular user privileges required.'));
  }
};

// 1) POST API to add a new Flight (Admin Only)
router.post('/add-flight', verifyAccessToken, isAdmin, async (req, res, next) => {
  try {
    const newFlightData = req.body;
    
    let newFlightNumber;
    let isUnique = false;

    // Generate a unique random flightNumber
    while (!isUnique) {
      newFlightNumber = generateRandomFlightNumber();
      const existingFlight = await Flight.findOne({ flightNumber: newFlightNumber });
      if (!existingFlight) {
        isUnique = true;
      }
    }

    newFlightData.flightNumber = newFlightNumber;

    const newFlight = new Flight(newFlightData);
    await newFlight.save();

    res.status(201).json(newFlight);
  } catch (error) {
    next(error);
  }
});

function generateRandomFlightNumber() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = `${alphabet[Math.floor(Math.random() * 26)]}${alphabet[Math.floor(Math.random() * 26)]}`;
  const randomNumbers = Math.floor(100 + Math.random() * 900);
  return `${randomLetters}-${randomNumbers}`;
}


// 2) PUT API to allow Admins to update an existing Flight's departure time only
router.put('/update-flight/:flightNumber', verifyAccessToken, isAdmin, async (req, res, next) => {
  try {
    const flightNumber = req.params.flightNumber;
    const updatedFlightData = req.body;

    // Ensure only "departureDateTime" is allowed for update
    const allowedUpdates = { departureDateTime: updatedFlightData.departureDateTime };
    const updatedFlight = await Flight.findOneAndUpdate({ flightNumber }, allowedUpdates, { new: true });

    if (!updatedFlight) {
      throw createError.NotFound('Flight not found');
    }

    // Update the associated Booking entries for the updated flight
    const updatedBookings = await Booking.updateMany({ flight: updatedFlight._id }, {
      flightDateTime: updatedFlight.departureDateTime, // Update relevant fields here
    });

    res.json(updatedFlight);
  } catch (error) {
    next(error);
  }
});

// 3) DELETE API to permanently delete an existing Flight by flightNumber (Admin Only)
router.delete('/delete-flight/:flightNumber', verifyAccessToken, isAdmin, async (req, res, next) => {
  try {
    const flightNumber = req.params.flightNumber;

    // Find the flight by flightNumber
    const flightToDelete = await Flight.findOne({ flightNumber });

    if (!flightToDelete) {
      throw createError.NotFound('Flight not found');
    }

    // Find and delete all Booking entries that reference the flightNumber
    await Booking.deleteMany({ flightNumber });

    // Delete the Flight entry
    await Flight.deleteOne({ flightNumber });

    res.json(flightToDelete);
  } catch (error) {
    next(error);
  }
});

// 4) GET API to view all existing Flights (Admin Only)
router.get('/view-flights', verifyAccessToken, isAdmin, async (req, res, next) => {
  try {
    const flights = await Flight.find();
    res.json(flights);
  } catch (error) {
    next(error);
  }
});

// 5) GET API to view Flights based on user search criteria (Regular Users Only)
router.get('/search-flights', verifyAccessToken, isUser, async (req, res, next) => {
    try {
      const { departureCity, destinationCity, departureDate } = req.query;
  
      if (!departureCity || !destinationCity || !departureDate) {
        throw createError.BadRequest('Please provide valid search criteria');
      }
  
      // Implement your flight search logic here
      const filteredFlights = await Flight.find({
        departureCity: departureCity,
        destinationCity: destinationCity,
        departureDateTime: new Date(departureDate),
      });
  
      res.json(filteredFlights);
    } catch (error) {
      next(error);
    }
  });


module.exports = router;
