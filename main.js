let main;
let dragons;
let breeds;

let jsonLastPushed;
let firstDate;
let jsonRepo = null;

async function run() {
	firstDate = Date.now();

	const mainResponse = await fetch('main.json');
	if (!mainResponse.ok) {
		throw new Error(`Error fetching main.json: ${mainResponse.status}`);
		document.getElementById('output').innerHTML = `Error fetching main.json: ${mainResponse.status}`;
		return;
	}
	main = await mainResponse.json();
	// console.log(main);

	jsonRepo = sessionStorage.getItem('jsonRepo');

	if (jsonRepo) {
		jsonRepo = JSON.parse(jsonRepo);
		console.log('Has jsonRepo Session Storage', jsonRepo, jsonRepo.pushed_at);
	} else {
		await checkGitAPI();
		console.log('Has No jsonRepo Session Storage', jsonRepo, jsonRepo.pushed_at);
		// console.log(gist);
	}
	jsonLastPushed = jsonRepo.pushed_at;

	await getJSON();
	draw();

	const y = sessionStorage.getItem('scrollY');
	if (y) window.scrollTo(0, parseInt(y));
}

async function checkGitAPI() {
	const rate_limit = await checkRateLimit();

	if (rate_limit.rate.remaining <= 0) return;

	jsonRepo = await fetch(`${main.jsonRepo}`, {
		cache: 'no-store'
	}).then(r => r.json());
	// console.log(gist);

	sessionStorage.setItem('jsonRepo', JSON.stringify(jsonRepo));
}

async function checkRateLimit() {
	return await fetch('https://api.github.com/rate_limit', {
		cache: 'no-store'
	}).then(r => r.json());
}

async function getJSON() {
	const playerResponse = await fetch(`${main.player}`, {
		cache: 'no-store'
	});
	if (!playerResponse.ok) {
		throw new Error(`Error fetching main.player json file: ${playerResponse.status}`);
		document.getElementById('output').innerHTML = `Error fetching main.player json file: ${playerResponse.status}`;
		return;
	}
	dragons = await playerResponse.json();
	dragons.sort(sortDragons);
	console.log('Dragons', dragons);

	const breedsResponse = await fetch(`${main.breeds}`, {
		cache: 'no-store'
	});
	if (!breedsResponse.ok) {
		throw new Error(`Error fetching main.breeds json file: ${breedsResponse.status}`);
		document.getElementById('output').innerHTML = `Error fetching main.breeds json file: ${breedsResponse.status}`;
		return;
	}
	breeds = await breedsResponse.json();
	// console.log(breeds);
}

async function draw() {
	const dateNow = Date.now();
	const dateStr = new Date(dateNow);

	let output = `<table>`;

	//  ========== HEADER ==========
	output += `<p><small>Last reloaded: ${dateStr}`;
	output += `<br>JSON last updated: ${new Date(jsonRepo.pushed_at)}`
	output += `<br><input type="checkbox" id="pauseReload">`;
	output += `<label for="pauseReload"> Pause Reload</label>`;
	output += `</small></p>`;

	output += `<tr><th>Egg</th><th>Dragons</th></tr>`;

	// ========== DRAGONS ==========
	let hidden = [];
	let dragonsDisplayed = 0;

	for (const breed of dragons) {
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
			output += `<img src="${breeds[breed.id].img[egg]}"`;
			output += `title="${breeds[breed.id].name[egg]}`;
			output += `\n${breeds[breed.id].description}" alt="${breeds[breed.id].name[egg]}">`;
			output += `</a>`;

			if (window.innerHeight >= window.innerWidth && egg + 1 < breeds[breed.id].name.length) {
				// portrait
				output += `<br>`
				continue;
			}

			if (egg + 1 >= breeds[breed.id].name.length) continue;
			// landscape
			output += ` `;
		}
		output += `</td>`;

		// View https://dragcave.net/image/r5HjG.gif
		output += `<td>`;
		for (const dragon of breed.view) {
			output += `<a href="https://dragcave.net/view/${dragon}" target="_blank">`;
			output += `<img title="${dragon}" src="https://dragcave.net/image/${dragon}.gif" alt="${dragon}">`;
			output += `</a> `;
			++dragonsDisplayed;
		}

		// End
		output += `</td></tr>`;
	}
	output += `</table>`;

	// console.log('==========')
	console.log('Dragons displayed', dragonsDisplayed);

	if (hidden.length > 0) output += `\n<h4 title="Breed group has >= 3 dragons, has all of them adults & displayed dragons is >= 50">Hidden</h4>`;
	// console.log(hidden);
	for (const id of hidden) {
		// console.log(id, breeds[id]);
		for (const egg in breeds[id].name) {
			output += `<a href="${breeds[id].encyclopedia}" target="_blank">`
			output += `<img src="${breeds[id].img[egg]}"`;
			output += `title="${breeds[id].name[egg]}`;
			output += `\n${breeds[id].description}">`;
			output += `</a>`;
		}
		output += ` `;
	}

	const rateLimit = await checkRateLimit();
	console.log(rateLimit);
	output += `<p id="rateLimit"><small>Rate limit remaining: ${rateLimit.rate.remaining} of ${rateLimit.rate.limit}`;
	output += `<br>Rate limit reset on: ${new Date((rateLimit.rate.reset + 1) * 1000)}`;
	output += `</small></p>`;

	document.getElementById('output').innerHTML = output;
}

// let counter = 0;
setInterval(async () => {
	// ++counter;
	if (document.getElementById('pauseReload').checked) return;

	const dateNow = Date.now();
	const dateStr = new Date(dateNow);
	const dateMinutes = dateStr.getMinutes();
	// console.log(dateStr.getMinutes());

	if (dateMinutes % 10 !== 0) return;
	if (dateStr.getSeconds() !== 0) return;
	console.log('Check', dateStr);

	sessionStorage.setItem('scrollY', window.scrollY);

	await checkGitAPI();
	const pushed_at = jsonRepo.pushed_at;

	// if (gistLastUpdated !== update_at) location.reload();
	if (jsonLastPushed !== pushed_at) {
		sessionStorage.setItem('jsonRepo', JSON.stringify(jsonRepo));
		location.reload();
	}

	if (dateMinutes % 30 === 0) location.reload();

	const rateLimit = await checkRateLimit();
	console.log(rateLimit);
	let output = `<small>Rate limit remaining: ${rateLimit.rate.remaining} of ${rateLimit.rate.limit}`;
	output += `<br>Rate limit reset on: ${new Date(rateLimit.rate.reset * 1000)}`;
	output += `</small>`;
	document.getElementById('rateLimit').innerHTML = output;

}, 1 * 1000);

window.onbeforeunload = function (event) {
	sessionStorage.setItem('scrollY', window.scrollY);
}

function sortDragons(a, b) {
	const aAdults = a.adults === a.view.length ? 1 : 0;
	const bAdults = b.adults === b.view.length ? 1 : 0;

	if (aAdults !== bAdults) return aAdults - bAdults;
	if (a.view.length !== b.view.length) return a.view.length - b.view.length;

	// if (aAdults === 1 && bAdults === 1) return a.id.localeCompare(b.id);

	if (a.adults !== b.adults) return a.adults - b.adults;
	if (a.hatchlings !== b.hatchlings) return a.hatchlings - b.hatchlings;
	if (a.date !== b.date) return b.date - a.date;

	return a.id.localeCompare(b.id);
}
