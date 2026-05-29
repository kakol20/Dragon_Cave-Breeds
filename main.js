let main;
let player;
let breeds;

let gistLastUpdated;

async function run() {
	const dateNow = Date.now();
	const mainResponse = await fetch('main.json');
	if (!mainResponse.ok) {
		throw new Error(`Error fetching main.json: ${mainResponse.staus}`);
		document.getElementById('output').innerHTML = `Error fetching main.json: ${mainResponse.status}`;
		return;
	}
	main = await mainResponse.json();
	// console.log(main);

	const gist = await fetch(`${main.gist}?t=${dateNow}`, {
		cache: "no-store"
	}).then(
		r => r.json()
	);
	gistLastUpdated = gist.updated_at;
	console.log(gist, gist.updated_at);

	await getJSON();
	draw();
}

async function getJSON() {
	const dateNow = Date.now();
	const playerResponse = await fetch(`${main.player}?t=${dateNow}`, {
		cache: "no-store"
	});
	if (!playerResponse.ok) {
		throw new Error(`Error fetching main.player json file: ${playerResponse.status}`);
		document.getElementById('output').innerHTML = `Error fetching main.player json file: ${playerResponse.status}`;
		return;
	}
	player = await playerResponse.json();
	player.dragons.sort(sortDragons);
	// console.log(playerResponse, player);

	const breedsResponse = await fetch(`${main.breeds}?t=${dateNow}`, {
		cache: "no-store"
	});
	if (!breedsResponse.ok) {
		throw new Error(`Error fetching main.breeds json file: ${breedsResponse.status}`);
		document.getElementById('output').innerHTML = `Error fetching main.breeds json file: ${breedsResponse.status}`;
		return;
	}
	breeds = await breedsResponse.json();
	// console.log(breeds);
}

function draw() {
	const dateNow = Date.now();

	let output = `<table>`;

	//  ========== HEADER ==========
	output += `<tr><th>Egg</th><th>Dragons</th></tr>`;

	// ========== DRAGONS ==========
	let hidden = [];
	let dragonsDisplayed = 0;

	for (const breed of player.dragons) {
		// console.log(breed);
		if (breed.view.length >= 3 &&
			breed.view.length === breed.adults &&
			dragonsDisplayed >= 50) {
			hidden.push(breed.id);
			continue;
		}

		output += `<tr>`;

		// Show egg
		output += `<td>`;
		for (const egg in breeds[breed.id].name) {
			output += `<a href="${breeds[breed.id].encyclopedia}" target="_blank">`;
			output += `<img src="${breeds[breed.id].img[egg]}?t=${dateNow}"`;
			output += `title="${breeds[breed.id].name[egg]}"`;
			output += `\n${breeds[breed.id].description}">`;
			output += `</a> `;
		}
		output += `</td>`;

		// View ttps://dragcave.net/image/r5HjG.gif
		output += `<td>`;
		for (const dragon of breed.view) {
			output += `<a href="https://dragcave.net/view/${dragon}" target="_blank">`;
			output += `<img src="https://dragcave.net/image/${dragon}.gif?t=${dateNow}" alt="${dragon}">`;
			output += `</a> `;
			++dragonsDisplayed;
		}

		// End
		output += `</td></tr>`;
	}
	output += `</table>`;

	// console.log('==========')
	console.log('Dragons displayed', dragonsDisplayed);

	if (hidden.length > 0) output += `\n<h4 title="Breed group has >= 3 adults & displayed dragons is >= 50">Hidden</h4>`;
	// console.log(hidden);
	for (const id of hidden) {
		// console.log(id, breeds[id]);
		for (const egg in breeds[id].name) {
			output += `<a href="${breeds[id].encyclopedia}" target="_blank">`
			output += `<img src="${breeds[id].img[egg]}?t=${dateNow}"`;
			output += `title="${breeds[id].name[egg]}`;
			output += `\n${breeds[id].description}">`;
			output += `</a> `;
		}
	}

	document.getElementById('output').innerHTML = output;
}

setInterval(async () => {
	const dateNow = Date.now();
	const gist = await fetch(`${main.gist}?t=${dateNow}`, {
		cache: "no-store"
	}).then(
		r => r.json()
	);
	const update_at = gist.updated_at;
	// console.log(gist, gist.updated_at);

	if (gistLastUpdated !== update_at) {
		gistLastUpdated = update_at;
		await getJSON();
		console.log('JSON Changed');
	}

	console.log('Redrawing');
	draw();
}, 10 * 60 * 1000);

function sortDragons(a, b) {
	if (a.view.length !== b.view.length) return a.view.length - b.view.length;
	if (a.adults !== b.adults) return a.adults - b.adults;
	if (a.date !== b.date) return b.date - a.date;

	return a.id.localeCompare(b.id);
}
