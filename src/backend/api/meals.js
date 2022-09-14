const express = require("express");
const router = express.Router();
const knex = require("../database");

router.get("/", async (request, response) => {
  try {
    // knex syntax for selecting things. Look up the documentation for knex for further info
    const titles = await knex("meal").select("title");
    response.json(titles);
  } catch (error) {
    throw error;
  }
});

router.get("/:id", async (request, response) => {
  try {
    const mealId = parseInt(request.params.id);
    const meal = await knex("meal")
      .select("title", "description", "location", "when", "price")
      .where({ id: mealId });

    if (meal.length === 0) {
      response.status(404).send(`meal with id ${mealId} not found`);
    } else {
      response.json(meal[0]);
    }
  } catch (error) {
    throw error;
  }
});

router.post("/", async (request, response) => {
  try {
    const id = await knex("meal").insert({
      title: request.body.title,
      description: request.body.description,
      location: request.body.location,
      when: request.body.mealDate,
      max_reservations: request.body.totalReservations,
      price: request.body.price,
      created_date: new Date(),
    });
    response.status(201).json({ insertedMealId: id });
  } catch (error) {
    throw error;
  }
});

router.put("/:id", async (request, response) => {
  try {
    const mealId = parseInt(request.params.id);
    const count = await knex("meal")
      .update({
        title: request.body.title,
        description: request.body.description,
        location: request.body.location,
        when: request.body.mealDate,
        max_reservations: request.body.totalReservations,
        price: request.body.price,
      })
      .where({ id: mealId });
    if (count) {
      response.status(200).json({ updated: count });
    } else {
      response.status(404).json({ message: "Record not found" });
    }
  } catch (error) {
    throw error;
  }
});

router.delete("/:id", async (request, response) => {
  try {
    const mealId = parseInt(request.params.id);
    const count = await knex("meal").where({ id: mealId }).del();
    if (count) {
      response.status(200).json({ deleted: count });
    } else {
      response.status(404).json({ message: "Record not found" });
    }
  } catch (error) {
    throw error;
  }
});

module.exports = router;
