const express = require('express');
const db = require('../firebaseInit');
const router = express.Router();
const Joi = require('joi');

// get recipe by recipeID
router.get("/get_recipe/:recipeID", async(req, res)=>{
});

// post recipe to the database
router.post("/add_recipe", async(req, res)=>{
});

// update recipe by recipeID
router.put("/update_recipe", async(req, res)=>{
});

// search for recipes by name and/or ingredients
router.get("/search_recipes", async(req, res)=>{
});

// get recipes all tag
router.get("/get_recipes_all_tag", async(req, res)=>{
});

// review recipe by recipeID
router.post("/review_recipe", async(req, res)=>{
});

// update review by recipeID
router.put("/update_review", async(req, res)=>{
});

// delete review by recipeID
router.delete("/delete_review", async(req, res)=>{
});



module.exports = router;