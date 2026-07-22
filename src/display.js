
async function draw() {
	const root = document.documentElement;

	const toggleThemeStore = sessionStorage.getItem('toggleTheme') === 'true';
	console.log(toggleThemeStore);

	if (toggleThemeStore) {
		root.style.colorScheme = 'light';
	} else {
		root.style.colorScheme = 'dark';
	}

	const debugMode = true;
	await getMainJson(debugMode);

	await Promise.all([getPlayerJson(debugMode), getBreedsJson(debugMode), getJsonRepo(true, debugMode)]);

	const portrait = window.matchMedia("(orientation: portrait)").matches;

	let output = '<br>';
	output += mainTable(portrait);

	document.getElementById('output').innerHTML = output;
}

function toggleTheme() {
	sessionStorage.setItem('toggleTheme', document.getElementById('toggleTheme').checked);

	const root = document.documentElement;

	if (document.getElementById('toggleTheme').checked) {
		root.style.colorScheme = 'light';
		return;
	}

	root.style.colorScheme = 'dark';
}

function mainTable(portrait = false) {
	let output = `<table ${portrait ? 'style="width:100%"' : ''}>`;
	output += `<tr><th style="padding:5px;">Egg</th>
		<th style="padding:5px;">Dragons</th></tr>`;

	return output;
}