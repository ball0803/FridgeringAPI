const Joi = require("joi");

const commonIngredientSchema = Joi.object({
	description: Joi.string().required(),
	foodNutritients: Joi.array().items(Joi.object()),
	foodAttributes: Joi.array().items(Joi.object()),
	fdcId: Joi.number().required(),
	inputFoods: Joi.array().items(Joi.object()),
	image: Joi.string().uri().optional(),
	foodPortions: Joi.array().items(Joi.object()),
	foodCategory: Joi.object().required(),
	ndbNumber: Joi.number().required(),
});

const commonIngredientUpdateSchema = Joi.object({
	description: Joi.string().optional(),
	foodNutritients: Joi.array().items(Joi.object()).optional(),
	foodAttributes: Joi.array().items(Joi.object()).optional(),
	inputFoods: Joi.array().items(Joi.object()).optional(),
	image: Joi.string().uri().optional(),
	foodPortions: Joi.array().items(Joi.object()).optional(),
	foodCategory: Joi.object().optional(),
});

module.exports = {
	commonIngredientSchema,
	commonIngredientUpdateSchema,
};
