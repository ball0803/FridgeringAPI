const express = require("express");
const db = require("../firebaseInit");
const router = express.Router();
const Joi = require("joi");
const algoliasearch = require("algoliasearch");
const client = algoliasearch("KR6AEAAQVV", "14c2bf68187cae21dfce2cab13e74ba9");
const index = client.initIndex("Ingredient");
async function indexData() {
	try {
		const docRef = db.collection("Ingredient");
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

const commonIngredientSchema = Joi.object({
	description: Joi.string().required(),
	foodNutritients: Joi.array().items(Joi.object()),
	foodAttributes: Joi.array().items(Joi.object()),
	fdcId: Joi.number().required(),
	inputFoods: Joi.array().items(Joi.object()),
	foodPortions: Joi.array().items(Joi.object()),
	foodCategory: Joi.object().required(),
	ndbNumber: Joi.number().required(),
});

const commonIngredientUpdateSchema = Joi.object({
	description: Joi.string().optional(),
	foodNutritients: Joi.array().items(Joi.object()).optional(),
	foodAttributes: Joi.array().items(Joi.object()).optional(),
	inputFoods: Joi.array().items(Joi.object()).optional(),
	foodPortions: Joi.array().items(Joi.object()).optional(),
	foodCategory: Joi.object().optional(),
});

// get common ingredient by ingredientID
router.post("/common_ingredient", async (req, res) => {
	const { error } = commonIngredientSchema.validate(req.body, {
		abortEarly: false,
	});

	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	const {
		description,
		foodNutritients,
		foodAttributes,
		fdcId,
		inputFoods,
		foodPortions,
		foodCategory,
		ndbNumber,
	} = req.body;
	const payload = {
		description: description,
		foodNutritients: foodNutritients,
		foodAttributes: foodAttributes,
		fdcId: fdcId,
		inputFoods: inputFoods,
		foodPortions: foodPortions,
		foodCategory: foodCategory,
		ndbNumber: ndbNumber,
	};
	const docRef = db.collection("Ingredient").doc();
	try {
		const response = await docRef
			.set(payload)
			.then(() => {
				res.status(200).send({ status: "OK", data: response });
			})
			.catch((error) => {
				res
					.status(400)
					.send({ status: "ERROR", data: "", error: error.toString() });
			});
	} catch (error) {
		res
			.status(400)
			.send({ status: "ERROR", data: "", error: error.toString() });
	}
});

// update common ingredient by ingredientID
router.put("/common_ingredient/:ndbNumber", async (req, res) => {
	const { error } = commonIngredientUpdateSchema.validate(req.body, {
		abortEarly: false,
	});

	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	const {
		description,
		foodNutritients,
		foodAttributes,
		inputFoods,
		foodPortions,
		foodCategory,
	} = req.body;
	const { ndbNumber } = req.params;
	const payload = {
		description: description,
		foodNutritients: foodNutritients,
		foodAttributes: foodAttributes,
		inputFoods: inputFoods,
		foodPortions: foodPortions,
		foodCategory: foodCategory,
	};

	const docRef = db.collection("Ingredient").doc();
	try {
		const response = await docRef
			.where("ndbNumber", "=", ndbNumber)
			.update(payload);
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res
			.status(400)
			.send({ status: "ERROR", data: "", error: error.toString() });
	}
});

// delete common ingredient by ingredientID
router.delete("/common_ingredient/:ndbNumber", async (req, res) => {
	const { ndbNumber } = req.params;
	const docRef = db.collection("Ingredient").doc();
	try {
		const response = await docRef.where("ndbNumber", "=", ndbNumber).delete();
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// search for common ingredients by name
router.get("/common_ingredients/search", async (req, res) => {
	const { name } = req.query;

	try {
		const response = await index.search(name);
		res.status(200).send({ status: "OK", data: response.hits });
	} catch (error) {
		res.status(400).send({ status: "ERROR", data: "", error: error });
	}
});

module.exports = router;
