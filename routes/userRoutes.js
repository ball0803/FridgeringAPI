const express = require('express');
const db = require('../firebaseInit');
const router = express.Router();
const Joi = require('joi');
const { FieldValue } = require('firebase-admin/firestore');

const schema = Joi.object({
    userID: Joi.string().required(),
    name: Joi.string().required(),
    image: Joi.string().required(),
    email: Joi.string().email().required(),
    preferences: Joi.object( {
        dietaryRestriction: Joi.array().items(Joi.string()),
        expireNotification: Joi.number().integer().min(0).max(7),
    })
});

// register with google account if ID does not exist
router.post("/user/register", async(req, res) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        return res.status(400).send({ status: "ERROR", data: errors });
    }

    const {userID, name, image, email, preferences} = req.body;
    const payload = {
        "userID": userID,
        "name": name,
        "image": image,
        "email": email,
        "preferences": preferences || []
    };

    try {
        const userRef = db.collection('Users').doc(userID);
        const response = await userRef.set(payload);
        res.status(200).send({ status: "OK", data: response });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
});

// get user all infomation by userID
router.get("/user/:userID", async(req, res) => {
    const userID = req.params.userID;
    try {
        const userRef = db.collection('Users').doc(userID);
        const response = await userRef.get();
        res.status(200).send({ status: "OK", data: response.data() });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
});

// update user
router.put("/user/:userID", async(req, res) => {
    const { userID } = req.params;
    const { name, image, email, preferences } = req.body;
    const payload = {}
    if (name) payload.name = name;
    if (image) payload.image = image;
    if (email) payload.email = email;
    if (preferences && preferences.dietaryRestriction) payload['preferences.dietaryRestriction'] = preferences.dietaryRestriction;
    if (preferences && preferences.expireNotification) payload['preferences.expireNotification'] = preferences.expireNotification;
    const userRef = db.collection('Users').doc(userID);
    try {
        const response = await userRef.update(payload);
        res.status(200).send({ status: "OK", data: response });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
});

// pinned recipes to user by userID and recipeID
router.post("/user/:userID/pin_recipe/:recipeID", async(req, res) => {
    const { userID, recipeID } = req.params;
    const userRef = db.collection('Users').doc();
    const userDoc = await userRef.get().where("userID", "==", userID);
    try {
        const response = await userDoc.update({ pinnedRecipes: FieldValue.arrayUnion(recipeID) });
        res.status(200).send({ status: "OK", data: response });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
});

// unpinned recipes by userID and recipeID
router.put("/user/:userID/pin_recipe/:recipeID", async(req, res) => {
    const { userID, recipeID } = req.params;
    const userRef = db.collection('Users').doc();
    const userDoc = await userRef.get().where("userID", "==", userID);
    try {
        const response = await userDoc.update({ pinnedRecipes: FieldValue.arrayRemove(recipeID) });
        res.status(200).send({ status: "OK", data: response });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
});

module.exports = router;