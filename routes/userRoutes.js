const express = require("express");
const db = require("../firebaseInit");
const router = express.Router();
const {
	userSchema,
	userUpdateSchema,
	userIngredientSchema,
	userIngredientUpdateSchema,
} = require("./validator/userSchema");
const { FieldValue } = require("firebase-admin/firestore");
const { Timestamp } = require("firebase-admin").firestore;

// register with google account if ID does not exist
router.post("/user/register", async (req, res) => {
	const { error } = userSchema.validate(req.body, { abortEarly: false });
	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	const { userID, name, image, email, preferences } = req.body;
	const payload = {
		userID: userID,
		name: name,
		image: image,
		email: email,
		preferences: preferences || [],
	};

	try {
		const userRef = db.collection("Users").doc(userID);
		let response = await userRef.set(payload);
		response.action = "create";
		response.doc = userRef.id;
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// get user all infomation by userID
router.get("/user/:userID", async (req, res) => {
	const userID = req.params.userID;
	try {
		const userRef = db.collection("Users").doc(userID);
		let response = await userRef.get();
		res.status(200).send({ status: "OK", data: response.data() });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// update user
router.put("/user/:userID", async (req, res) => {
	const { error } = userUpdateSchema.validate(req.body, { abortEarly: false });

	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	const { userID } = req.params;
	const { name, image, email, preferences } = req.body;

	const payload = {};
	if (name) payload.name = name;
	if (image) payload.image = image;
	if (email) payload.email = email;
	if (preferences && preferences.dietaryRestriction)
		payload["preferences.dietaryRestriction"] = preferences.dietaryRestriction;
	if (preferences && preferences.expireNotification)
		payload["preferences.expireNotification"] = preferences.expireNotification;

	try {
		const userRef = db.collection("Users").doc(userID);
		let response = await userRef.update(payload);
		response.action = "update";
		response.doc = userRef.id;
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// pinned recipes to user by userID and recipeID
router.post("/user/:userID/pin_recipes/:recipeID", async (req, res) => {
	const { userID, recipeID } = req.params;
	try {
		const userRef = db.collection("Users").doc(userID);
		let response = await userRef.update({
			pinnedRecipes: FieldValue.arrayUnion(recipeID),
		});
		response.action = "update";
		response.doc = userRef.id;
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// unpinned recipes by userID and recipeID
router.delete("/user/:userID/pin_recipes/:recipeID", async (req, res) => {
	const { userID, recipeID } = req.params;
	const userRef = db.collection("Users").doc(userID);
	try {
		let response = await userRef.update({
			pinnedRecipes: FieldValue.arrayRemove(recipeID),
		});
		response.action = "update";
		response.doc = userRef.id;
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// get user ingredient list by userID
router.get("/user/:userID/ingredients", async (req, res) => {
	const { userID } = req.params;

	try {
		const docRef = db.collection("Users").doc(userID);
		let response = await docRef.collection("Ingredient").get();
		res
			.status(200)
			.send({ status: "OK", data: response.docs.map((doc) => doc.data()) });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// add user ingredient to the user list
router.post("/user/:userID/ingredients", async (req, res) => {
	const { error } = userIngredientSchema.validate(req.body, {
		abortEarly: false,
	});

	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}
	const { userID } = req.params;
	const { addedDate, amount, expiredDate, fcdId, name, unit } = req.body;

	const payload = {
		addedDate:
			Timestamp.fromDate(new Date(addedDate)) || FieldValue.serverTimestamp(),
		amount: amount,
		expiredDate: Timestamp.fromDate(new Date(expiredDate)),
		fcdId: fcdId,
		name: name,
		unit: unit,
	};

	try {
		const docRef = db.collection("Users").doc(userID);
		let response = await docRef
			.collection("Ingredient")
			.doc(fcdId.toString())
			.set(payload);
		response.action = "create";
		response.doc = docRef.id;
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// update user ingredient from the user list
router.put("/user/:userID/ingredients/:fcdId", async (req, res) => {
	const { error } = userIngredientUpdateSchema.validate(req.body, {
		abortEarly: false,
	});

	if (error) {
		const errors = error.details.map((err) => err.message);
		return res.status(400).send({ status: "ERROR", error: errors });
	}

	const { userID, fcdId } = req.params;
	const { addedDate, amount, expiredDate, unit } = req.body;

	const payload = {};
	if (addedDate !== undefined) payload.addedDate = addedDate;
	if (amount !== undefined) payload.amount = amount;
	if (expiredDate !== undefined) payload.expiredDate = expiredDate;
	if (unit !== undefined) payload.unit = unit;

	try {
		const docRef = db.collection("Users").doc(userID);
		let response = await docRef
			.collection("Ingredient")
			.doc(fcdId.toString())
			.update(payload)
			.catch((error) => {
				console.error(error);
				res.status(400).send({ status: "ERROR", error: error.toString() });
			});
		response.action = "update";
		response.doc = docRef.id;
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

// delete user ingredient from the user list
router.delete("/user/:userID/ingredients/:fcdId", async (req, res) => {
	const { userID, fcdId } = req.params;
	try {
		const docRef = db.collection("Users").doc(userID);
		let response = await docRef
			.collection("Ingredient")
			.doc(fcdId.toString())
			.delete()
			.catch((error) => {
				console.error(error);
				res.status(400).send({ status: "ERROR", error: error.toString() });
			});
		response.action = "delete";
		response.doc = docRef.id;
		res.status(200).send({ status: "OK", data: response });
	} catch (error) {
		res.status(400).send({ status: "ERROR", error: error.toString() });
	}
});

module.exports = router;
