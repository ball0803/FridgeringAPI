const Joi = require("joi");

const recipeIngredientSchema = Joi.object({
	amount: Joi.string().allow(null, "").optional(),
	name: Joi.string().allow(null, "").optional(),
	common_name: Joi.string().allow(null, "").optional(),
	unit: Joi.string().allow(null, "").optional(),
	fcdId: Joi.number().optional(),
	original: Joi.string().required(),
});

const recipeIngredientUpdateSchema = Joi.object({
	amount: Joi.string().allow(null, "").optional(),
	name: Joi.string().allow(null, "").optional(),
	common_name: Joi.string().allow(null, "").optional(),
	unit: Joi.string().allow(null, "").optional(),
	fcdId: Joi.number().optional(),
	original: Joi.string().optional(),
});

const recipeSchema = Joi.object({
	cookTime: Joi.number().required(),
	prepTime: Joi.number().required(),
	image: Joi.array().items(Joi.string().uri()).optional(),
	name: Joi.string().required(),
	ingredients: Joi.array().items(recipeIngredientSchema).required(),
	instructions: Joi.array().items(Joi.string()).required(),
	tags: Joi.array().items(Joi.string()).optional(),
	url: Joi.string().uri().optional(),
});

const recipeUpdateSchema = Joi.object({
	cookTime: Joi.number().optional(),
	prepTime: Joi.number().optional(),
	image: Joi.array().items(Joi.string().uri()).optional(),
	name: Joi.string().optional(),
	instructions: Joi.array().items(Joi.string()).optional(),
	tags: Joi.array().items(Joi.string()).optional(),
	url: Joi.string().uri().optional(),
});

const reviewSchema = Joi.object({
	userID: Joi.string().required(),
	image: Joi.string().uri().optional(),
	name: Joi.string().required(),
	rating: Joi.number().integer().min(0).max(5).required(),
	text: Joi.string().optional(),
});

const reviewUpdateSchema = Joi.object({
	rating: Joi.number().integer().min(0).max(5).optional(),
	text: Joi.string().optional(),
});

module.exports = {
	recipeSchema,
	recipeUpdateSchema,
	recipeIngredientSchema,
	recipeIngredientUpdateSchema,
	reviewSchema,
	reviewUpdateSchema,
};
