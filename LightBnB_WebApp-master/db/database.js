const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require("pg");

//Database connection setup
const config = {
  user: "labber",
  password: "labber",
  host: "localhost",
  database: "lightbnb",
};

const pool = new Pool(config);

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`select * from users where email = $1`, [email])
    .then((result) => {
      return result.rows.length ? result.rows[0] : null;
    })
    .catch((err) => {
      return {
        error: err,
        message: "An error occurred while fetching the user with email.",
      };
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`select * from users where id = $1`, [id])
    .then((result) => {
      return result.rows.length ? result.rows[0] : null;
    })
    .catch((err) => {
      return {
        error: err,
        message: "An error occurred while fetching the user with id.",
      };
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const values = [user.name, user.email, user.password];
  console.log(values);
  return pool
    .query(
      `insert into users (name, email, password) values ($1, $2, $3) returning *;`,
      values
    )
    .then((result) => {
      return result;
    })
    .catch((err) => {
      return {
        error: err,
        message: "An error occurred while adding the user.",
      };
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(
      `select
  properties.*
from
  reservations
  join properties on properties.id = reservations.property_id
  join property_reviews on properties.id = property_reviews.property_id
where
  reservations.guest_id = $1
group by
  properties.id, reservations.id
order by
  start_date
limit
  $2;`,
      [guest_id, limit]
    )
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      return {
        error: err,
        message: "An error occurred while fetching the reservations of user.",
      };
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  return pool
    .query(`select * from properties limit $1`, [limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      return {
        error: err,
        message: "An error occurred while fetching the properties.",
      };
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
