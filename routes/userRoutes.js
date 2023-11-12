const express = require('express');
const db = require('../firebaseInit');
const router = express.Router();
const Joi = require('joi');

const schema = Joi.object({
    userID: Joi.string().required(),
    name: Joi.string().required(),
    image: Joi.string().required(),
    email: Joi.string().email().required(),
    preferences: Joi.array().items(Joi.string())
});

// login with google account and check with ID
router.post("/login", async(req, res) => {
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
        res.status(400).send({ status: "ERROR", data: error.toString() });
    }
});

// get user all infomation by userID
router.get("/get_user/:userID", async(req, res) => {
    const userID = req.params.userID;
    try {
        const userRef = db.collection('Users');
        const response = await userRef.get().where("userID", "==", userID);
        res.status(200).send({ status: "OK", data: response.data() });
    } catch (error) {
        res.status(400).send({ status: "ERROR", data: error.toString() });
    }
});

// update user diet preferences
router.post("/update_user_preferences", async(req, res) => {
});

// pinned recipes to user by userID and recipeID
router.post("/pin_recipe", async(req, res) => {
});

// unpinned recipes by userID and recipeID
router.put("/unpin_recipe", async(req, res) => {
});

module.exports = router;