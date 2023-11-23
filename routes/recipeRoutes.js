const express = require("express");
const db = require("../firebaseInit");
const router = express.Router();
const Joi = require("joi");
const algoliasearch = require("algoliasearch");
const client = algoliasearch("KR6AEAAQVV", "a9c6b549e2bb7620f65c641fa1d77876");
const index = client.initIndex("Recipes");
async function indexData() {
	try {
		await index.setSettings({ attributesForFaceting: ["tags"] });
		const docRef = db.collection("Recipes");
		const snapshot = await docRef.get();
		const batch = snapshot.docs.map((doc) => {
			let data = doc.data();
			data.objectID = doc.id;
			return data;
		});

		await index.saveObjects(batch); // add await here if saveObjects returns a promise
	} catch (error) {
		console.error("Error indexing data:", error);
	}
}

indexData();

const RecipeIngredient = Joi.object({
	amount: Joi.string().allow(null, "").optional(),
	name: Joi.string().allow(null, "").optional(),
	common_name: Joi.string().allow(null, "").optional(),
	unit: Joi.string().allow(null, "").optional(),
	fcdId: Joi.number().optional(),
	original: Joi.string().required(),
});

const recipeSchema = Joi.object({
	cookTime: Joi.number().required(),
	prepTime: Joi.number().required(),
	image: Joi.array().items(Joi.string().uri()).optional(),
	name: Joi.string().required(),
	ingredients: Joi.array().items(RecipeIngredient).required(),
	instructions: Joi.array().items(Joi.string()).required(),
	tags: Joi.array().items(Joi.string()).optional(),
	url: Joi.string().uri().optional(),
});

const reviewSchema = Joi.object({
	image: Joi.string().uri().optional(),
	name: Joi.string().required(),
	rating: Joi.number().required(),
	text: Joi.string().optional(),
});

const reviewUpdateSchema = Joi.object({
	image: Joi.string().uri().optional(),
	name: Joi.string().optional(),
	rating: Joi.number().optional(),
	text: Joi.string().optional(),
});

// post recipe to the database
router.post("/recipes", async (req, res) => {
	const { error } = recipeSchema.validate(req.body, { abortEarly: false });

	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	const {
		cookTime,
		prepTime,
		image,
		name,
		ingredients,
		instructions,
		tags,
		url,
	} = req.body;
	const payload = {
		cookTime: cookTime,
		prepTime: prepTime,
		image: image || [],
		name: name,
		instructions: instructions,
		tags: tags || [],
		url: url || "",
	};
	try {
		const docRef = db.collection("Recipes").doc();
		payload.recipeID = docRef.id;
		const response1 = await docRef.set(payload);
		const ingredientsRef = docRef.collection("Ingredients");
		for (const ingredient of ingredients) {
			const ingredientRef = ingredientsRef.doc();
			ingredient.ingredientId = ingredientRef.id;
			await ingredientRef.set(ingredient);
		}
		res.status(200).send({ status: "OK", data: response1 });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// search for recipes by name and/or ingredients
router.get("/recipes/search", async (req, res) => {
	const { name, tags, match, cookTime, userID } = req.query;
	try {
		const userIngredientRef = db
			.collection("Users")
			.doc(userID)
			.collection("ingredient");
		const userIngredientsSnapshot = await userIngredientRef.get();
		const userIngredients = userIngredientsSnapshot.docs.map((doc) =>
			doc.data()
		);
		const recipesSnapshot = await index.search(name, { facetFilters: tags });

		if (!match) {
			const matchingRecipes = [];
			for (let recipeDoc of recipesSnapshot.hits) {
				const recipeIngredientsRef = db
					.collection("Recipes")
					.doc(recipeDoc.recipeID)
					.collection("Ingredients");
				const recipeIngredientsSnapshot = await recipeIngredientsRef.get();
				const recipeIngredients = recipeIngredientsSnapshot.docs.map((doc) =>
					doc.data()
				);

				// Check if any of the recipe's ingredients are in the user's ingredients
				const hasMatchingIngredient = recipeIngredients.some(
					(recipeIngredient) =>
						userIngredients.some(
							(userIngredient) =>
								userIngredient.name === recipeIngredient.common_name
						)
				);

				if (hasMatchingIngredient) {
					matchingRecipes.push(recipeDoc.data());
				}
			}
			res.status(200).send({ status: "OK", data: matchingRecipes });
		} else {
			res.status(200).send({ status: "OK", data: recipesSnapshot.hits });
		}
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error });
	}
});

// get recipe by recipeID
router.get("/recipes/:recipeID", async (req, res) => {
	const recipesID = req.params.recipeID;
	const docRef = db.collection("Recipes").doc(recipesID);
	try {
		const response = await docRef.get();
		res.status(200).send({ status: "OK", data: response.data() });
	} catch (error) {
		res
			.status(400)
			.send({ status: "ERROR", data: "", error: error.toString() });
	}
});

// update recipe by recipeID
router.put("/recipes/:recipeID", async (req, res) => {
	const { recipeID } = req.params;
	const {
		cookTime,
		prepTime,
		image,
		name,
		ingredients,
		instructions,
		tags,
		url,
	} = req.body;
	const payload = {};
	if (cookTime !== undefined) payload.cookTime = cookTime;
	if (prepTime !== undefined) payload.prepTime = prepTime;
	if (image !== undefined) payload.image = image;
	if (name !== undefined) payload.name = name;
	if (instructions !== undefined) payload.instructions = instructions;
	if (tags !== undefined) payload.tags = tags;
	if (url !== undefined) payload.url = url;

	try {
		const docRef = db.collection("Recipes").doc(recipeID);
		if (Object.keys(payload).length !== 0) {
			const response = await docRef.update(payload);
		}
		if (ingredients !== undefined) {
			const ingredientsRef = docRef.collection("Ingredients");
			for (const ingredient of ingredients) {
				const ingredientRef = ingredientsRef.doc(ingredient.ingredientId);
				const response = await ingredientRef
					.set(ingredient, { merge: true })
					.catch((error) => {
						console.error(error);
						res.status(400).send({ status: "ERROR", error: error.toString() });
					});
			}
		}
		res
			.status(200)
			.send({ status: "OK", message: "Recipe updated successfully" });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// get recipes all tag
router.get("/setting/tags", async (req, res) => {
	const settingRef = db.collection("Setting").doc("Tag");
	try {
		const doc = await settingRef.get();
		res.status(200).send({ status: "OK", data: doc.data() });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// review recipe by recipeID
router.post("/recipes/:recipeID/reviews", async (req, res) => {
	const { error } = reviewSchema.validate(req.body, { abortEarly: false });

	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	const recipesID = req.params.recipeID;
	const { image, name, rating, text } = req.body;

	// Generate a random ID for the review

	const payload = {
		image: image,
		name: name,
		rating: rating,
		text: text,
	};
	const docRef = db.collection("Recipes").doc(recipesID);
	try {
		const reviewDoc = docRef.collection("Reviews").doc();
		payload.reviewID = reviewDoc.id;
		const response = await reviewDoc.set(payload);
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// update review by recipeID
router.put("/recipes/:recipeID/reviews/:reviewID", async (req, res) => {
	const { recipeID, reviewID } = req.params;
	const { image, name, rating, text } = req.body;

	let payload = {};
	if (image !== undefined) payload.image = image;
	if (name !== undefined) payload.name = name;
	if (rating !== undefined) payload.rating = rating;
	if (text !== undefined) payload.text = text;

	const { error } = reviewUpdateSchema.validate(payload, { abortEarly: false });
	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	try {
		const docRef = db
			.collection("Recipes")
			.doc(recipeID)
			.collection("Reviews")
			.doc(reviewID);
		const response = await docRef.update(payload).catch((error) => {
			console.error(error);
			res.status(400).send({ status: "ERROR", error: error.toString() });
		});
		res.status(200).send({ status: "OK", message: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// delete review by recipeID
router.delete("/recipes/:recipesID/reviews/:reviewID", async (req, res) => {
	const { recipesID, reviewID } = req.params;

	try {
		const response = await db
			.collection("Recipes")
			.doc()
			.where("recipeID", "==", recipesID)
			.collection("Reviews")
			.doc()
			.where("reviewID", "==", reviewID)
			.delete()
			.catch((error) => {
				console.error(error);
				res.status(400).send({ status: "ERROR", error: error.toString() });
			});
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

module.exports = router;
