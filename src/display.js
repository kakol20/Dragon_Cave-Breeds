
async function draw() {
	const debugMode = true;
	await getMainJson(debugMode);

	await Promise.all([getPlayerJson(debugMode), getBreedsJson(debugMode), getJsonRepo(true, debugMode)]);
}