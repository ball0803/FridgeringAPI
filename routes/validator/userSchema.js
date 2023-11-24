const Joi = require("joi");

const userSchema = Joi.object({
	userID: Joi.string().required(),
	name: Joi.string().required(),
	image: Joi.string().required(),
	email: Joi.string().email().required(),
	preferences: Joi.object({
		dietaryRestriction: Joi.array().items(Joi.string()),
		expireNotification: Joi.number().integer().min(0).max(7),
	}).required(),
});

const userUpdateSchema = Joi.object({
	name: Joi.string().optional(),
	image: Joi.string().optional(),
	email: Joi.string().email().optional(),
	preferences: Joi.object({
		dietaryRestriction: Joi.array().items(Joi.string()),
		expireNotification: Joi.number().integer().min(0).max(7),
	}).optional(),
});

const userIngredientSchema = Joi.object({
	addedDate: Joi.date().optional(),
	amount: Joi.number().required(),
	expiredDate: Joi.date().optional(),
	fcdId: Joi.number().required(),
	name: Joi.string().required(),
	unit: Joi.string().allow(null).optional(),
});

const userIngredientUpdateSchema = Joi.object({
	addedDate: Joi.date().optional(),
	amount: Joi.number().optional(),
	expiredDate: Joi.date().optional(),
	fcdId: Joi.number().optional(),
	unit: Joi.string().allow(null).optional(),
});

module.exports = {
	userSchema,
	userUpdateSchema,
	userIngredientSchema,
	userIngredientUpdateSchema,
};
