const { Client } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jwt-simple");

const client = new Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_auth_db"
);

client.connect();

const sync = async () => {
  const SQL = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  DROP TABLE IF EXISTS users;
  CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    CHECK (char_length(username) > 0)
  );
  `;
  await client.query(SQL);

  const [lucy, moe] = await Promise.all([
    createUser({ username: "moe", password: "MOE" }),
    createUser({ username: "lucy", password: "LUCY" }),
    createUser({ username: "curly", password: "CURLY" })
  ]);

  // console.log(await readUsers());

  const token = await authenticate({ username: "lucy", password: "LUCY" });

  const user = await findUserFromToken(token);
  console.log(user);
  //await authenticate({username:'moe', password: 'MOE'});
};

const findUserFromToken = async (token) => {
  const id = jwt.decode(token, process.env.JWT).id;
  //TODO remove password from user
  return (await client.query("SELECT * FROM users WHERE id=$1", [id])).rows[0];
};

const authenticate = async ({ username, password }) => {
  const user = (
    await client.query("SELECT * from users WHERE username=$1", [username])).rows[0];
  await compare({ plain: password, hashed: user.password });
  return jwt.encode({ id: user.id }, process.env.JWT);
};

const compare = async ({ plain, hashed }) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plain, hashed, (err, result) => {
      if (err) {
        return reject(err);
      }
      if (result === true) {
        return resolve();
      }
      reject(Error("bad credentials"));
    });
  });
};

const readUsers = async () => {
  //TODO remove password
  return (await client.query("SELECT * from users")).rows;
};

const createUser = async ({ username, password }) => {
  const hashed = await hash(password);
  return (
    await client.query(
      "INSERT INTO users(username, password) values ($1, $2) returning *",
      [username, hashed]
    )
  ).rows[0];
};

//TODO
const hash = plain => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(plain, 10, (err, hashed) => {
      if (err) {
        return reject(err);
      }
      resolve(hashed);
    });
  });
};

module.exports = {
  sync,
  authenticate,
  findUserFromToken
};
