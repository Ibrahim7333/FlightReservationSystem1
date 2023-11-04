const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const createError = require('http-errors')
const mongoose = require('mongoose');
const { authorizationSchema } = require('../Helpers/ValidationSchema')
const bcrypt = require('bcrypt');
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


// 1) POST API to allow all users to sign up
router.post('/sign-up', async (req, res, next) => {
  try {
    const result = await authorizationSchema.validateAsync(req.body);
    const doesExist = await User.findOne({ email: result.email });
    if (doesExist) throw createError.Conflict(`${result.email} has already been registered`);

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(result.password, salt)

    console.log('Creating user...');
    const user = new User({
      email: result.email,
      fullname: result.fullname,
      username: result.username,
      password: hashedPassword,
      isAdmin: result.isAdmin
    });

    const savedUser = await user.save();
    console.log('User created:', savedUser);

    const accessToken = await signAccessToken(savedUser.id);
    const refreshToken = await signRefreshToken(savedUser.id);
    res.send({ accessToken, refreshToken });
  } catch (error) {
    if (error.isJoi === true) error.status = 422;
    next(error);
  }
});

// 2) POST API to allow all users to log in
router.post('/log-in', async (req, res, next) => {
  try {
      const result = await authorizationSchema.validateAsync(req.body)
      const user = await User.findOne({ email:result.email })

      if (!user) throw createError.NotFound('User is not registered')
      if (user.status == "InActive") throw createError.NotFound('User has been deleted')
      
      const isMatch = await user.isValidPassword(result.password)
      if (!isMatch) throw createError.Unauthorized('Username/password not valid')

      const accessToken = await signAccessToken(user.id)
      const refreshToken = await signRefreshToken(user.id)
      res.send({ accessToken, refreshToken })

  } catch (error) {
      if (error.isJoi === true)
          return next(createError.BadRequest("Invalid Username/Password"))
      next(error)
  }
})

// 3) PUT API to allow all users to update their profile by user id
router.put('/update-user/:id', verifyAccessToken, async (req, res, next) => {
  const result = await authorizationSchema.validateAsync(req.body);
  bcrypt.hash(req.body.password, 10, async (err, hash) => {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    } else {
      let updatedUser;

      updatedUser = await User.findOneAndUpdate(
        { _id: req.params.id },
        {
          $set: {
            username: result.username,
            firstname: result.firstname,
            password: hash,
            email: result.email,
            isAdmin: result.isAdmin
          },
        },
        { new: true }
      );

      res.status(200).json({
        updated_User: updatedUser,
      });
    }
  });
});

// 4) GET API to allow only Admins to view all registered users
router.get('/view-users', verifyAccessToken, isAdmin, (req, res, next) => {
  User.find()
    .then((result) => {
      res.status(200).json({
        data: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.get('/', verifyAccessToken, async (req, res, next) => {
    //req.payload.aud gives us the id of the logged in user 
    User.findById(req.payload.aud)
        .then(result => {
            //Getting all the users
            User.find({ user_id: result.user_id })
                .exec()
                .then(result => {
                    res.status(200).json({
                        Users: result
                    })
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json({
                        error: err
                    })
                })
        })
})

router.post('/refresh-token', async (req, res, next) => {
    try {
        const { refreshToken } = req.body
        if (!refreshToken) throw createError.BadRequest()
        const userId = await verifyRefreshToken(refreshToken)

        const accessToken = await signAccessToken(userId)
        const refToken = await signRefreshToken(userId)
        //res.send({ accessToken: accessToken, refreshToken: refToken })

    } catch (error) {
        next(error)

    }
})


module.exports = router;