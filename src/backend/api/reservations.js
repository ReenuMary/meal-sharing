const express = require("express");
const router = express.Router();
const knex = require("../database");

router.get("/", async (request, response) => {
  try {
    const reservations = await knex("reservation").select("*");
    response.json(reservations);
  } catch (error) {
    throw error;
  }
});

router.get("/:id", async (request, response) => {
  try {
    const reservationId = parseInt(request.params.id);
    const reservation = await knex("reservation")
      .select("*")
      .where({ id: reservationId });

    if (reservation.length === 0) {
      response
        .status(404)
        .send(`reservation with id ${reservationId} not found`);
    } else {
      response.json(reservation[0]);
    }
  } catch (error) {
    throw error;
  }
});

router.post("/", async (request, response) => {
  try {
    const mealId = request.body.meal_id;
    const requestedReservations = request.body.guestsCount;
    const maxReservations = await knex("meal")
      .select("max_reservations")
      .where({ id: mealId });
    const totalReservations = await knex("reservation")
      .sum("number_of_guests as total")
      .where({ meal_id: mealId });
    const availableReservations =
      maxReservations[0].max_reservations -
      (totalReservations[0].total === null ? 0 : totalReservations[0].total);

    if (requestedReservations > availableReservations) {
      response.status(400).json({
        requestedReservations: requestedReservations,
        availableReservations: availableReservations,
      });
    } else {
      const id = await knex("reservation").insert({
        number_of_guests: request.body.guestsCount,
        meal_id: request.body.meal_id,
        created_date: new Date(),
        contact_phone_number: request.body.contactPhoneNumber,
        contact_name: request.body.contactName,
        contact_email: request.body.contactEmail,
      });
      response.status(201).json({ newReservationId: id });
    }
  } catch (error) {
    throw error;
  }
});

router.put("/:id", async (request, response) => {
  try {
    const reservationId = parseInt(request.params.id);
    const count = await knex("reservation")
      .where({ id: reservationId })
      .update({
        number_of_guests: request.body.guestsCount,
        meal_id: request.body.mealId,
        contact_phone_number: request.body.contactPhoneNumber,
        contact_name: request.body.contactName,
        contact_email: request.body.contactEmail,
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
    const reservationId = parseInt(request.params.id);
    const countOfDeletedRecords = await knex("reservation")
      .where({ id: reservationId })
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
