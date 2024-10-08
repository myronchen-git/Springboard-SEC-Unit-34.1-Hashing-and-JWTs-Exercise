/** User class for message.ly */

const bcrypt = require('bcrypt');

const db = require('../db');
const ExpressError = require('../expressError');
const { BCRYPT_WORK_FACTOR } = require('../config');

// ==================================================

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({
    username,
    password,
    first_name: firstName,
    last_name: lastName,
    phone,
  }) {
    if (!username || !password || !firstName || !lastName || !phone) {
      throw new ExpressError(
        'Missing required user info for registration.',
        400
      );
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const joinAt = new Date();

    const results = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, firstName, lastName, phone, joinAt, joinAt]
    );

    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    if (!username || !password) {
      throw new ExpressError('Missing username or password.', 400);
    }

    const results = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]
    );

    if (results.rowCount === 0) {
      return false;
    }

    const hashedPassword = results.rows[0].password;

    return await bcrypt.compare(password, hashedPassword);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const results = await db.query(
      `UPDATE users SET last_login_at = $1 WHERE username = $2`,
      [new Date(), username]
    );

    if (results.rowCount === 0) {
      throw new ExpressError(`No such user: ${username}.`, 404);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users`
    );

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (results.rowCount === 0) {
      throw new ExpressError(`No such user: ${username}.`, 404);
    }

    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    return await User._messagesHelper(username, 'from');
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    return await User._messagesHelper(username, 'to');
  }

  static async _messagesHelper(username, type) {
    // next 2 variables are used for getting correct messages table columns
    let usernameColumnToLookup;
    let usernameColumnToLookFor;
    let outputTargetUserName;

    if (type === 'from') {
      // these must match messages table columns
      usernameColumnToLookup = 'from_username';
      usernameColumnToLookFor = 'to_username';

      // this must match expected output name for user data
      outputTargetUserName = 'to_user';
    } else if (type === 'to') {
      // these must match messages table columns
      usernameColumnToLookup = 'to_username';
      usernameColumnToLookFor = 'from_username';

      // this must match expected output name for user data
      outputTargetUserName = 'from_user';
    } else {
      throw new ExpressError(
        'Invalid type for messagesHelper.  It must be either "from" or "to".',
        404
      );
    }

    // get messages from user
    const messagesResults = await db.query(
      `SELECT id, ${usernameColumnToLookFor}, body, sent_at, read_at
      FROM messages
      WHERE ${usernameColumnToLookup} = $1`,
      [username]
    );

    // quick return empty Array if no messages were found
    if (messagesResults.rowCount === 0) {
      return [];
    }

    // get all unique usernames
    const usernames = messagesResults.rows.reduce(
      (users, row) => users.add(row[usernameColumnToLookFor]),
      new Set()
    );

    // get data for users from usernames
    const usersResults = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users
      WHERE username = ANY($1::text[])`,
      [Array.from(usernames)]
    );

    // create Map (username: user data) for easier look up later
    const users = usersResults.rows.reduce(
      (users, row) => users.set(row.username, row),
      new Map()
    );

    // create message list with correct structure
    const messages = messagesResults.rows.map((row) => {
      row[outputTargetUserName] = users.get(row[usernameColumnToLookFor]);
      delete row[usernameColumnToLookFor];
      return row;
    });

    return messages;
  }
}

// ==================================================

module.exports = User;
