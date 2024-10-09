const express = require('express');
const jwt = require('jsonwebtoken');

const ExpressError = require('../expressError');
const User = require('../models/user');
const { SECRET_KEY } = require('../config');

// ==================================================

const router = new express.Router();

// --------------------------------------------------

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (await User.authenticate(username, password)) {
      await User.updateLoginTimestamp(username);

      const token = jwt.sign({ username }, SECRET_KEY, {
        expiresIn: 60 * 60,
      });

      return res.json({ token });
    } else {
      throw new ExpressError('Incorrect username / password.', 400);
    }
  } catch (err) {
    next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
  try {
    const user = await User.register(req.body);

    const token = jwt.sign({ username: user.username }, SECRET_KEY, {
      expiresIn: 60 * 60,
    });

    return res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
});

// ==================================================

module.exports = router;
