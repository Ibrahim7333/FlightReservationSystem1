const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const Booking = require('../Models/Booking');
const Flight = require('../Models/Flight'); 
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../Helpers/JwtHelper');

// Middleware to check if a user is a regular user
const isUser = (req, res, next) => {
  if (!req.user.isAdmin) {
    next(); // User is a regular user, continue
  } else {
    next(createError(403, 'Access denied. Regular user privileges required.'));
  }
};

// Middleware to check if a user is an admin
const isAdmin = (req, res, next) => {
    if (req.user.isAdmin) {
      next(); // User is an admin, continue
    } else {
      next(createError(403, 'Access denied. Admin privileges required.'));
    }
  };
  

// 1) POST API to allow a regular user to book a flight
router.post('/create-booking', verifyAccessToken, isUser, async (req, res, next) => {
    try {
      const { flightNumber, fareType, luggageWeight } = req.body;
  
      // Find the flight based on the provided flightNumber
      const selectedFlight = await Flight.findOne({ flightNumber });
  
      if (!selectedFlight) {
        throw createError.NotFound('Flight not found');
      }
  
      // Calculate finalFare based on fare type
      let finalFare = 0;
    
      // Validate and fetch prices from the selectedFlight
      if (selectedFlight.prices && selectedFlight.prices[fareType]) {
        finalFare = selectedFlight.prices[fareType];
      } 
      else {
        throw createError.BadRequest('Invalid fare type or price not available');
      }

      // Generate a random seatNumber and aircraftModel (you can customize this logic)
      const seatNumber = "A5"
      const aircraftModel = "Boeing 777";
  
      // Get the departure date from the selected flight
      const flightDateTime = selectedFlight.departureDateTime;
  
      // Create a Booking schema object with the provided attributes
      const newBooking = new Booking({
        user: req.user._id, // Assuming the user is authenticated and their ID is in req.user
        flightNumber,
        fareType,
        luggageWeight,
        finalFare,
        seatNumber,
        aircraftModel,
        flightDateTime
      });
  
      // Save the booking to the database
      await newBooking.save();
  
      // Respond with the booking details
      res.json({
        flightNumber,
        seatNumber,
        aircraftModel,
        flightDateTime,
        finalFare
      });
    } catch (error) {
      next(error);
    }
  });

// 2) DELETE API to allow a non-admin user to delete a booking by flight number
router.delete('/delete-booking/:flightNumber', verifyAccessToken, isUser, async (req, res, next) => {
    try {
      const flightNumber = req.params.flightNumber;
  
      // Find the booking by matching flightNumber and user ID
      const bookingToDelete = await Booking.findOne({
        flightNumber,
        user: req.user._id,
      });
  
      if (!bookingToDelete) {
        throw createError.NotFound('Booking not found');
      }
  
      // Delete the booking
      await Booking.deleteOne({flightNumber});
  
      res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
      next(error);
    }
  });
  
  // 3) GET API to view all bookings made by the user
  router.get('/view-my-bookings', verifyAccessToken, isUser, async (req, res, next) => {
    try {
      const userBookings = await Booking.find({ user: req.user._id });
      res.json(userBookings);
    } catch (error) {
      next(error);
    }
  });
  
  // 4) GET API to view all bookings made by all users (Admin Only)
  router.get('/view-all-bookings', verifyAccessToken, isAdmin, async (req, res, next) => {
    try {
      const allBookings = await Booking.find();
      res.json(allBookings);
    } catch (error) {
      next(error);
    }
  });

  module.exports = router;