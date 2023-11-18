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
    preferences: Joi.array().items(Joi.string())
});

// register with google account if ID does not exist
router.post("/register", async(req, res) => {
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
        const userRef = db.collection('User').doc(userID);
        const response = await userRef.set(payload);
        res.status(200).send({ status: "OK", data: response });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
});

// get user all infomation by userID
router.get("/get_user/:userID", async(req, res) => {
    const { email, name } = req.query;
    const userID = req.params.userID;
    try {
        const userRef = db.collection('Users');
        const response = await userRef.get().where("userID", "==", userID).where("email", "==", email).where("name", "==", name);
        res.status(200).send({ status: "OK", data: response.data() });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
});

// update user diet preferences
router.post("/update_user_preferences", async(req, res) => {
    const { userID, preferences } = req.body;
    const userRef = db.collection('Users').doc();
    const userDoc = await userRef.get().where("userID", "==", userID);
    try {
        const response = await userDoc.update({ preferences: preferences });
        res.status(200).send({ status: "OK", data: response });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: "", error: error.toString() });
    }
});

// pinned recipes to user by userID and recipeID
router.post("/pin_recipe", async(req, res) => {
    const { userID, recipeID } = req.body;
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
router.put("/unpin_recipe", async(req, res) => {
    const { userID, recipeID } = req.body;
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