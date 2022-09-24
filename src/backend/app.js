const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");

const mealsRouter = require("./api/meals");
const reservationsRouter = require("./api/reservations");
const reviewRouter = require("./api/reviews");

const buildPath = path.join(__dirname, "../../dist");
const port = process.env.PORT || 3000;
const cors = require("cors");
const { CleanPlugin } = require("webpack");

const knex = require("knex")({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

// For week4 no need to look into this!
// Serve the built client html
app.use(express.static(buildPath));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.use(cors());
app.use("/api/reservations", reservationsRouter);
app.use("/api/reviews", reviewRouter);
router.use("/meals", mealsRouter);

app.get("/future-meals", async (req, res) => {
  const dbResult = await knex.raw("SELECT * FROM `meal` WHERE `when` > NOW()");
  const rows = dbResult[0];
  if (rows.length === 0) {
    res.status(404).send("Could not find any meals with a future date.");
  } else {
    res.send(rows);
  }
});

app.get("/past-meals", async (req, res) => {
  const dbResult = await knex.raw("SELECT * FROM `meal` WHERE `when` <= NOW()");
  const rows = dbResult[0];
  if (rows.length === 0) {
    res.status(404).send("Could not find any meals with a past date.");
  } else {
    res.send(rows);
  }
});

app.get("/all-meals", async (req, res) => {
  const dbResult = await knex.raw("SELECT * FROM `meal` ORDER BY `id`");
  const rows = dbResult[0];
  if (rows.length === 0) {
    res.status(404).send("Could not find any meals.");
  } else {
    res.send(rows);
  }
});

app.get("/first-meal", async (req, res) => {
  const dbResult = await knex.raw("SELECT * FROM `meal` ORDER BY `id` LIMIT 1");
  const row = dbResult[0];
  if (row.length === 0) {
    res.status(404).send("Could not find any meals.");
  }
  res.send(row[0]);
});

app.get("/last-meal", async (req, res) => {
  const dbResult = await knex.raw(
    "SELECT * FROM `meal` ORDER BY `id` DESC LIMIT 1"
  );
  const row = dbResult[0];
  if (row.length === 0) {
    res.status(404).send("Could not find any meals.");
  }
  res.send(row[0]);
});

if (process.env.API_PATH) {
  app.use(process.env.API_PATH, router);
} else {
  throw "API_PATH is not set. Remember to set it in your .env file";
}

// for the frontend. Will first be covered in the react class
app.use("*", (req, res) => {
  res.sendFile(path.join(`${buildPath}/index.html`));
});

module.exports = app;
