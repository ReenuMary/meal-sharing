const express = require("express");
const router = express.Router();
const knex = require("../database");

router.get("/", async (request, response) => {
  try {
    const reviews = await knex("review").select("*");
    response.json(reviews);
  } catch (error) {
    throw error;
  }
});

router.get("/:id", async (request, response) => {
  try {
    const reviewId = parseInt(request.params.id);
    const review = await knex("review")
      .select("id", "title", "description", "meal_id", "stars", "created_date")
      .where({ id: reviewId });

    if (review.length === 0) {
      response.status(404).send(`review with id ${reviewId} not found`);
    } else {
      response.json(review[0]);
    }
  } catch (error) {
    throw error;
  }
});

router.post("/", async (request, response) => {
  try {
    const mealId = parseInt(request.body.mealId);
    // check meal id validity
    const meal = await knex("meal")
      .select("id", "title")
      .where("id", "=", mealId);
    if (meal.length === 0) {
      return response.status(400).json({ message: "Invalid mealId" });
    }
    const id = await knex("review").insert({
      title: request.body.title,
      description: request.body.description,
      meal_id: request.body.mealId,
      stars: request.body.stars,
      created_date: new Date(),
    });
    response.status(201).json({ newReviewId: id });
  } catch (error) {
    throw error;
  }
});

router.put("/:id", async (request, response) => {
  try {
    const reviewId = parseInt(request.params.id);
    const mealId = parseInt(request.body.mealId);
    // check meal id validity
    const meal = await knex("meal")
      .select("id", "title")
      .where("id", "=", mealId);
    if (meal.length === 0) {
      return response.status(400).json({ message: "Invalid mealId" });
    }

    const count = await knex("review").where({ id: reviewId }).update({
      title: request.body.title,
      meal_id: request.body.mealId,
      description: request.body.description,
      stars: request.body.stars,
    });

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
    const reviewId = parseInt(request.params.id);
    const countOfDeletedRecords = await knex("review")
      .where({ id: reviewId })
      .del();
    if (countOfDeletedRecords) {
      response.status(200).json({ deleted: countOfDeletedRecords });
    } else {
      response.status(404).json({ message: "Record not found" });
    }
  } catch (error) {
    throw error;
  }
});

module.exports = router;
