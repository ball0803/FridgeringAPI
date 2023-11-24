const express = require("express");
const router = express.Router();
const db = require("../firebaseInit");
const { recipesIndex } = require("../algoliaInit");
const {
	recipeSchema,
	recipeUpdateSchema,
	reviewSchema,
	reviewUpdateSchema,
	recipeIngredientSchema,
	recipeIngredientUpdateSchema,
} = require("./validator/recipeSchema");

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
		const recipesSnapshot = await recipesIndex.search(name, {
			facetFilters: tags,
		});

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
	const recipeID = req.params.recipeID;
	try {
		const docRef = db.collection("Recipes").doc(recipeID);
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
	const { error } = recipeUpdateSchema.validate(req.body, {
		abortEarly: false,
	});

	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	const { recipeID } = req.params;
	const { cookTime, prepTime, image, name, instructions, tags, url } = req.body;
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
		res
			.status(200)
			.send({ status: "OK", message: "Recipe updated successfully" });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

router.delete("/recipes/:recipeID", async (req, res) => {
	const { recipeID } = req.params;
	try {
		const response = await db
			.collection("Recipes")
			.doc(recipeID)
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

// get recipe ingredients by recipeID
router.get("/recipes/:recipeID/ingredients", async (req, res) => {
	const { recipeID } = req.params;
	try {
		const docRef = db.collection("Recipes").doc(recipeID);
		const snapshot = await docRef.collection("Ingredients").get();
		const ingredients = snapshot.docs.map((doc) => doc.data());
		res.status(200).send({ status: "OK", data: ingredients });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// add recipe ingredients by recipeID
router.post("/recipes/:recipeID/ingredients", async (req, res) => {
	const { error } = recipeIngredientSchema.validate(req.body, {
		abortEarly: false,
	});

	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	const { recipeID } = req.params;
	const { amount, name, common_name, unit, fcdId, original } = req.body;
	const payload = {
		amount: amount,
		name: name,
		common_name: common_name,
		unit: unit,
		fcdId: fcdId,
		original: original,
	};
	try {
		const docRef = db.collection("Recipes").doc(recipeID);
		const ingredientRef = docRef.collection("Ingredients").doc();
		payload.ingredientId = ingredientRef.id;
		const response = await ingredientRef.set(payload);
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// update recipe ingredients by recipeID
router.put("/recipes/:recipeID/ingredients/:ingredientId", async (req, res) => {
	const { error } = recipeIngredientUpdateSchema.validate(req.body, {
		abortEarly: false,
	});

	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	const { recipeID, ingredientId } = req.params;
	const { amount, name, common_name, unit, fcdId, original } = req.body;
	const payload = {};
	if (amount !== undefined) payload.amount = amount;
	if (name !== undefined) payload.name = name;
	if (common_name !== undefined) payload.common_name = common_name;
	if (unit !== undefined) payload.unit = unit;
	if (fcdId !== undefined) payload.fcdId = fcdId;
	if (original !== undefined) payload.original = original;

	try {
		const docRef = db
			.collection("Recipes")
			.doc(recipeID)
			.collection("Ingredients")
			.doc(ingredientId);
		const response = await docRef.update(payload).catch((error) => {
			console.error(error);
			res.status(400).send({ status: "ERROR", error: error.toString() });
		});
		res.status(200).send({ status: "OK", message: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// delete recipe ingredients by recipeID
router.delete(
	"/recipes/:recipeID/ingredients/:ingredientId",
	async (req, res) => {
		const { recipeID, ingredientId } = req.params;

		try {
			const response = await db
				.collection("Recipes")
				.doc(recipeID)
				.collection("Ingredients")
				.doc(ingredientId)
				.delete()
				.catch((error) => {
					console.error(error);
					res.status(400).send({ status: "ERROR", error: error.toString() });
				});
			res.status(200).send({ status: "OK", data: response });
		} catch (error) {
			res.status(400).send({ status: "ERROR", error: error.toString() });
		}
	}
);
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

router.get("/recipes/:recipeID/reviews", async (req, res) => {
	const { recipeID } = req.params;
	try {
		const docRef = db.collection("Recipes").doc(recipeID).collection("Reviews");
		const snapshot = await docRef.get();
		const reviews = snapshot.docs.map((doc) => doc.data());
		res.status(200).send({ status: "OK", data: reviews });
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

	const { recipeID } = req.params;
	const { userID, image, name, rating, text } = req.body;

	const payload = {
		userID: userID,
		image: image,
		name: name,
		rating: rating,
		text: text,
	};
	try {
		const docRef = db.collection("Recipes").doc(recipeID);
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
router.delete("/recipes/:recipeID/reviews/:reviewID", async (req, res) => {
	const { recipeID, reviewID } = req.params;

	try {
		const response = await db
			.collection("Recipes")
			.doc(recipeID)
			.collection("Reviews")
			.doc(reviewID)
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