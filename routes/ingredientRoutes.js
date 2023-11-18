const express = require('express');
const db = require('../firebaseInit');
const router = express.Router();
const Joi = require('joi');

const commonIngredientSchema = Joi.object({
    description: Joi.string().required(),
    foodNutritients: Joi.array().items(Joi.object()),
    foodAttributes: Joi.array().items(Joi.object()),
    fdcId: Joi.number().required(),
    inputFoods: Joi.array().items(Joi.object()),
    foodPortions: Joi.array().items(Joi.object()),
    foodCategory: Joi.object().required(),
    ndbNumber: Joi.number().required()
});

// get common ingredient by ingredientID
router.post("/add_common_ingredient", async(req, res)=>{
    const { error } = commonIngredientSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map(err => err.message);
        return res.status(400).send({ status: "ERROR", error: errors });
    }

    const {description, foodNutritients, foodAttributes, fdcId, inputFoods, foodPortions, foodCategory, ndbNumber} = req.body
    const payload = {
        "description": description,
        "foodNutritients": foodNutritients,
        "foodAttributes": foodAttributes,
        "fdcId": fdcId,
        "inputFoods": inputFoods,
        "foodPortions": foodPortions,
        "foodCategory": foodCategory,
        "ndbNumber": ndbNumber
    }
    const docRef = db.collection('Ingredient').doc()
    const response = await docRef.set(payload);
    try {
        res.status(200).send({ status: "OK", data: response });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
})

// update common ingredient by ingredientID
router.put("/update_common_ingredient", async(req, res)=>{
});

// delete common ingredient by ingredientID
router.delete("/delete_common_ingredient", async(req, res)=>{
});

// search for common ingredients by name
router.get("/common_ingredients/search", async(req, res)=>{
    const { name } = req.query;
    const docRef = db.collection('Ingredient');
    try {
        const response = await docRef.limit(100).get();
        res.status(200).send({ status: "OK", data: response.docs.map(doc => doc.data()) });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
});

// add user ingredient to the user list
router.post("/add_user_ingredient", async(req, res) => {
});

// delete user ingredient from the user list
router.delete("/delete_user_ingredient", async(req, res) => {
});

module.exports = router;