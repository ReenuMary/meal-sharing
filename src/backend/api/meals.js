const express = require("express");
const router = express.Router();
const knex = require("../database");

router.get("/", async (request, response) => {
  try {
    // knex syntax for selecting things. Look up the documentation for knex for further info
    let query = knex("meal").select(
      "meal.id",
      "title",
      "description",
      "location",
      "when",
      "max_reservations",
      "price",
      "meal.created_date"
    );

    if ("maxPrice" in request.query) {
      const maxPrice = parseInt(request.query.maxPrice);
      query = query.where("price", "<", maxPrice);
    }
    if ("title" in request.query) {
      query = query.where("title", "like", `%${request.query.title}%`);
    }
    if ("dateAfter" in request.query) {
      const dateAfter = new Date(request.query.dateAfter);
      if (dateAfter != "Invalid Date") {
        query = query.where("when", ">", dateAfter);
      } else {
        console.log(
          "Given dateAfter query parameter is invalid. YYYY-MM-DD format expected. Currently dateAfter ignored "
        );
      }
    }
    if ("dateBefore" in request.query) {
      const dateBefore = new Date(request.query.dateBefore);
      if (dateBefore != "Invalid Date") {
        query = query.where("when", "<", dateBefore);
      } else {
        console.log(
          "Given dateBefore query parameter is invalid. YYYY-MM-DD format expected. Currently dateBefore ignored "
        );
      }
    }
    if ("limit" in request.query) {
      const limit = parseInt(request.query.limit);
      if (!isNaN(limit)) query = query.limit(limit);
      else console.log("Invalid limit parameter. Therefore ignored ");
    }
    if ("sort_key" in request.query) {
      const orderByField = request.query.sort_key;
      let sortOrder;
      if (
        orderByField === "when" ||
        orderByField === "max_reservations" ||
        orderByField === "price"
      ) {
        if ("sort_dir" in request.query) {
          if (request.query.sort_dir.toLowerCase() === "desc")
            sortOrder = "desc";
          else sortOrder = "asc";
        }
        query = query.orderBy(orderByField, sortOrder);
      } else {
        console.log(
          "Invalid sort_key. Expected value when or max_reservations or price "
        );
      }
    }

    /*
    if ("availableReservations" in request.query) {
      select meal.id, meal.title, meal.when ,meal.price ,meal.max_reservations,
ifnull( sum(reservation.number_of_guests),0 )as 'totalReservations'
from meal left join  reservation
on meal.id= reservation.meal_id
group by meal.id, meal.title, meal.when ,meal.price
 having meal.max_reservations > totalReservations*/

    if (request.query.availableReservations === "true") {
      query = query
        .select(
          knex.raw(
            "ifnull( sum(reservation.number_of_guests),0 )as 'totalReservations'"
          )
        )
        .leftJoin("reservation", { "meal.id": "reservation.meal_id" })
        .groupBy(
          "meal.id",
          "meal.title",
          "meal.description",
          "meal.location",
          "meal.when",
          "meal.max_reservations",
          "meal.price",
          "meal.created_date"
        )
        .having("meal.max_reservations", ">", "totalReservations");
    }
    console.log(query.toSQL().toNative());
    const titles = await query;
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

router.get("/:meal_id/reviews", async (request, response) => {
  try {
    const mealId = parseInt(request.params.meal_id);
    // check meal id validity
    const meal = await knex("meal")
      .select("id", "title")
      .where("id", "=", mealId);
    if (meal.length === 0) {
      return response.status(400).json({ message: "Invalid mealId" });
    }

    const reviews = await knex("review")
      .select("*")
      .where("meal_id", "=", mealId);
    if (reviews.length === 0) {
      response
        .status(404)
        .json({ message: `No reviews found for meal with id ${mealId}` });
    } else {
      response.json(reviews);
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
    const count = await knex("meal").where({ id: mealId }).update({
      title: request.body.title,
      description: request.body.description,
      location: request.body.location,
      when: request.body.mealDate,
      max_reservations: request.body.totalReservations,
      price: request.body.price,
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
