require("dotenv").config();
const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require("pg");

//Database connection setup
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
};

const pool = new Pool(config);

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const queryParams = [email];
  let queryString = `SELECT * FROM users WHERE email = $1`;

  return pool
    .query(queryString, queryParams)
    .then((result) => (result.rows.length ? result.rows[0] : null))
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
  const queryParams = [id];
  let queryString = `SELECT * FROM users WHERE id = $1`;

  return pool
    .query(queryString, queryParams)
    .then((result) => (result.rows.length ? result.rows[0] : null))
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
  let queryString = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`;
  const queryParams = [user.name, user.email, user.password];

  return pool
    .query(queryString, queryParams)
    .then((result) => result)
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
  let queryString = `SELECT properties.* 
  FROM reservations
  JOIN properties ON properties.id = reservations.property_id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY start_date
  LIMIT $2;`;

  const queryParams = [guest_id, limit];
  return pool
    .query(queryString, queryParams)
    .then((result) => result.rows)
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
  const queryParams = [];
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `JOIN users ON $${queryParams.length} = properties.owner_id`;
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    if (queryString.includes("WHERE")) {
      queryString += `AND cost_per_night >= $${queryParams.length}`;
    } else {
      queryString += `WHERE cost_per_night >= $${queryParams.length}`;
    }
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    if (queryString.includes("WHERE")) {
      queryString += `AND cost_per_night <= $${queryParams.length}`;
    } else {
      queryString += `WHERE cost_per_night <= $${queryParams.length}`;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `
    GROUP BY properties.id
    HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  if (queryString.includes("GROUP BY")) {
    queryString += `
    ORDER BY cost_per_night
  LIMIT $${queryParams.length};`;
  } else {
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  }

  return pool
    .query(queryString, queryParams)
    .then((res) => res.rows)
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
  const queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
  ];
  let queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;
  `;

  return pool
    .query(queryString, queryParams)
    .then((result) => result)
    .catch((err) => {
      return {
        error: err,
        message: "An error occurred while adding the property.",
      };
    }); 
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
