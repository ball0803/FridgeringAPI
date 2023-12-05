require("dotenv").config();
const db = require("./firebaseInit");
const algoliasearch = require("algoliasearch");
const client = algoliasearch(
	process.env.ALGOLIA_APP_ID,
	process.env.ALGOLIA_API_KEY
);

const recipesIndex = client.initIndex("Recipes");
const ingredientIndex = client.initIndex("Ingredient");

async function indexData(index, collectionName, searchableAttributes) {
	console.log("Indexing data for", collectionName);
	try {
		const settings = await index.getSettings();

		if (
			JSON.stringify(settings.attributesForFaceting) !==
				JSON.stringify(["tags"]) ||
			JSON.stringify(settings.searchableAttributes) !==
				JSON.stringify(searchableAttributes)
		) {
			await index.setSettings({
				attributesForFaceting: ["tags"],
				searchableAttributes: searchableAttributes,
			});
		}

		const docRef = db.collection(collectionName);
		const snapshot = await docRef.get();
		const batch = snapshot.docs.map((doc) => {
			let data = doc.data();
			data.objectID = doc.id;
			return data;
		});

		await index.saveObjects(batch);
	} catch (error) {
		console.error(`Error indexing data for ${collectionName}:`, error);
	}
	console.log("Finished indexing data for", collectionName);
}

indexData(recipesIndex, "Recipes", ["name"]);
indexData(ingredientIndex, "Ingredient", ["description"]);

module.exports = { recipesIndex, ingredientIndex };
