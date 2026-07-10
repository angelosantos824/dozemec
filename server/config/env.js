const dotenv = require("dotenv");

dotenv.config();

const requiredEnv = [
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_NAME",
  "JWT_SECRET",
  "JWT_EXPIRES_IN"
];

function validateEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Variaveis de ambiente ausentes: ${missing.join(", ")}`);
  }
}

validateEnv();

module.exports = {
  port: Number(process.env.PORT),
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  }
};
