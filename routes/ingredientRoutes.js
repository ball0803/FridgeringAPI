const express = require("express");
const db = require("../firebaseInit");
const router = express.Router();
const { ingredientIndex } = require("../algoliaInit");
const {
	commonIngredientSchema,
	commonIngredientUpdateSchema,
} = require("./validator/ingredientSchema");

// added common ingredient by ingredientID
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
		let response = await docRef
			.set(payload)
			.then(() => {
				response.action = "create";
				response.doc = docRef.id;
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

// search for common ingredients by name
router.get("/common_ingredient/search", async (req, res) => {
	const { name } = req.query;

	try {
		let response = await ingredientIndex.search(name);
		res.status(200).send({ status: "OK", data: response.hits });
	} catch (error) {
		res.status(400).send({ status: "ERROR", data: "", error: error });
	}
});

// serach for common ingredients by fdcId
router.get("/common_ingredient/:fdcId", async (req, res) => {
	const fdcId = Number(req.params.fdcId);
	try {
		const docRef = db.collection("Ingredient");
		let response = await docRef.where("fdcId", "==", fdcId).get();
		res.status(200).send({
			status: "OK",
			data: response.docs[0].data(),
		});
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// update common ingredient by ingredientID
router.put("/common_ingredient/:fdcId", async (req, res) => {
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

	const fdcId = Number(req.params.fdcId);
	const payload = {
		description: description,
		foodNutritients: foodNutritients,
		foodAttributes: foodAttributes,
		inputFoods: inputFoods,
		foodPortions: foodPortions,
		foodCategory: foodCategory,
	};

	const docRef = db.collection("Ingredient");
	try {
		const snapshot = await docRef.where("fdcId", "==", fdcId).limit(1).get();
		if (!snapshot.empty) {
			const doc = snapshot.docs[0];
			let response = await doc.ref.update(payload);
			response.action = "update";
			response.doc = doc.id;
			res.status(200).send({ status: "OK", data: response });
		} else {
			res
				.status(404)
				.send({ status: "ERROR", error: "No matching document found" });
		}
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// delete common ingredient by ingredientID
router.delete("/common_ingredient/:fdcId", async (req, res) => {
	const fdcId = Number(req.params.fdcId);
	const docRef = db.collection("Ingredient");
	try {
		const snapshot = await docRef.where("fdcId", "==", fdcId).get();
		if (!snapshot.empty) {
			const doc = snapshot.docs[0];
			let response = await doc.ref.delete();
			response.action = "delete";
			response.doc = doc.id;
			res.status(200).send({ status: "OK", data: response });
		} else {
			res.status(404).send({ status: "ERROR", error: "No document found" });
		}
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

module.exports = router;
