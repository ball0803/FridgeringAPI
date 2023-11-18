const express = require('express');
const db = require('../firebaseInit');
const router = express.Router();
const Joi = require('joi');

const recipeSchema = Joi.object({
    cookTiem: Joi.number().optional(),
    image: Joi.link().optional(),
    instructions: Joi.array().items(Joi.string()).required(),
    name: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).optional(),
    url: Joi.link().optional(),
});

const reviewSchema = Joi.object({
    image: Joi.link().optional(),
    name: Joi.string().required(),
    rating: Joi.number().required(),
    text: Joi.string().optional()
});

const reviewUpdateSchema = Joi.object({
    image: Joi.link().optional(),
    name: Joi.string().optional(),
    rating: Joi.number().optional(),
    text: Joi.string().optional()
});

// get recipe by recipeID
router.get("/recipes/:recipeID", async(req, res)=>{
    const recipesID = req.params.recipeID;
    const docRef = db.collection('Recipes').doc();
    try {
        const response = await docRef.where('recipeID', '==', recipesID).get();
        res.status(200).send({ status: "OK", data: response.docs.map(doc => doc.data()) });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
});

// post recipe to the database
router.post("/recipes", async(req, res)=>{
    const { error } = recipeSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map(err => err.message);
        return res.status(400).send({ status: "ERROR", error: errors });
    }

    const {cookTiem, image, instructions, name, tags, url} = req.body
    const payload = {
        "cookTiem": cookTiem || 0,
        "image": image || "",
        "instructions": instructions,
        "name": name,
        "tags": tags || [],
        "url": url || ""
    }
});

// update recipe by recipeID
router.put("/recipes/:recipesID", async(req, res)=>{
});

// search for recipes by name and/or ingredients
router.get("/recipes/search", async(req, res)=>{
});

// get recipes all tag
router.get("/recipes/tags", async(req, res)=>{
    const settingRef = db.collection('Setting').doc('Tag');
    try {
        const doc = await settingRef.get();
        res.status(200).send({ status: "OK", data: doc.data() });
    } catch (error) {
        res.status(400).send({ status: "ERROR", error: error.toString() });
    }
});

// review recipe by recipeID
router.post("/recipes/:recipeID/reviews", async(req, res)=>{
    const { error } = reviewSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map(err => err.message);
        return res.status(400).send({ status: "ERROR", error: errors });
    }

    const recipesID = req.params.recipeID;
    const { image, name, rating, text } = req.body;

    // Generate a random ID for the review
    const reviewID = db.collection('Reviews').doc().id;

    const payload = {
        "reviewID": reviewID,
        "image": image,
        "name": name,
        "rating": rating,
        "text": text
    }
    const docRef = db.collection('Recipes').doc();
    try {
        const response = await docRef.where("recipeID", "==", recipesID).collection("Reviews").set(
            payload
        );
        res.status(200).send({ status: "OK", data: response });
    } catch (error) {
        res.status(400).send({ status: "ERROR", error: error.toString() });
    }

});

// update review by recipeID
router.put("/recipes/:recipeID/reviews/:reviewID", async(req, res)=>{
    const { recipeID, reviewID } = req.params;
    const { image, name, rating, text } = req.body;

    let payload = {};
    if (image !== undefined) payload.image = image;
    if (name !== undefined) payload.name = name;
    if (rating !== undefined) payload.rating = rating;
    if (text !== undefined) payload.text = text;

    const { error } = reviewUpdateSchema.validate(payload, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        return res.status(400).send({ status: "ERROR", error: errors });
    }

    try {
        const docRef = db.collection('Recipes').doc(recipeID).collection('Reviews').doc(reviewID);
        await docRef.update(payload);
        res.status(200).send({ status: "OK", message: "Review updated successfully" });
    } catch (error) {
        res.status(400).send({ status: "ERROR", error: error.toString() });
    }
});

// delete review by recipeID
router.delete("/reviews/:recipesID/reviews/:reviewID", async(req, res)=>{
    const { recipesID, reviewID } = req.params;

    try{
        const response = await db.collection('Recipes').doc().where("recipeID", "==", recipesID)
                        .collection("Reviews").doc().where("reviewID", "==", reviewID).delete();
        res.status(200).send({ status: "OK", data: response });
    } catch (error) {
        res.status(400).send({ status: "ERROR", error: error.toString() });
    }
});


module.exports = router;