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
	try {
		const portrait = window.matchMedia("(orientation: portrait)").matches;

		if (!portrait) {
			await drawLandscape();
		} else {
			await drawPortrait();
		}
	} catch (err) {
		document.getElementById('output').innerHTML = `${err}<br>Reloading in 5 seconds`;
		await sleep(5 * 1000);
		await customReload();
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

window.matchMedia("(orientation: portrait)").addEventListener("change", async e => {
	await draw();
});

const maxDisplay = 50;
async function drawPortrait() {
	const dateNow = lastReloaded;
	const dateStr = new Date(dateNow);

	let output = ``;

	//  ========== HEADER ==========
	output += `<p><small>Last reloaded: ${dateStr}`;
	output += `<br>JSON last updated: ${new Date(jsonRepo.pushed_at)}`
	output += `<br><input type="checkbox" id="pauseReload">`;
	output += `<label for="pauseReload"> Pause Reload</label>`;
	output += `</small></p>`;

	output += `<table style="width:100%"><tr>
		<th style="padding:5px;">Egg</th>
		<th style="padding:5px;">Dragons</th></tr>`;

	// ========== DRAGONS ==========
	let hidden = [];
	let unfinished = [];
	let dragonsDisplayed = 0;

	for (const breed of dragons) {
		if (dragonsDisplayed >= maxDisplay &&
			breed.view.length >= breed.adults &&
			breed.finished) {
			hidden.push(breed.id);
			continue;
		}

		if (dragonsDisplayed >= maxDisplay &&
			breed.view.length === breed.adults) {
			// hidden.push(breed.id);

			unfinished.push(breed.id);
			continue;
		}

		// ==== EGGS ====
		for (const egg in breeds[breed.id].name) {
			output += `<tr>`

			output += `<td style="padding:2px;"><a href="${breeds[breed.id].encyclopedia}" target="_blank">`;
			output += `<img src="${breeds[breed.id].img[egg]}"`;
			output += `title="${breeds[breed.id].name[egg]}`;
			output += `\n${breeds[breed.id].description}" alt="${breeds[breed.id].name[egg]}">`;
			output += `</a></td>`;

			// ==== DRAGONS ====
			if (egg === '0') {
				output += `<td rowspan="${breeds[breed.id].name.length}" style="padding:2px;">`;

				for (const dragon of breed.view) {
					output += `<a href="https://dragcave.net/view/${dragon}" target="_blank">`;
					output += `<img title="${dragon}" src="https://dragcave.net/image/${dragon}.gif" alt="${dragon}">`;
					output += `</a> `;
					++dragonsDisplayed;
				}

				output += `</td>`;
				// console.log('Hit');
			}

			output += `</tr>`
		}
	}
	output += `</table>`;

	console.log('Dragons displayed', dragonsDisplayed);

	if (unfinished.length > 0) {
		output += `<br><table><tbody>`
		output += `<tr><th style="padding:5px;">Unfinished</th></tr>`;
		output += `<tr><td style="padding:2px; line-height: 1;">`

		for (const id of unfinished) {
			for (const egg in breeds[id].name) {
				output += `<a href="${breeds[id].encyclopedia}" target="_blank">`
				output += `<img src="${breeds[id].img[egg]}"`;
				output += `title="${breeds[id].name[egg]}`;
				output += `\n${breeds[id].description}">`;
				output += `</a>`;
			}
			output += ` `;
		}
		output += `</td></tr>`;
		output += `</tbody></table>`;
	}

	if (hidden.length > 0) {
		output += `<br><table><tbody>`
		output += `<tr><th style="padding:5px;">Finished</th></tr>`;
		output += `<tr><td style="padding:2px; line-height: 1;">`;

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
		output += `</td></tr>`;
		output += `</tbody></table>`;
	}

	const rateLimit = await checkRateLimit();
	console.log(rateLimit);
	output += `<p id="rateLimit"><small>Rate limit remaining: ${rateLimit.rate.remaining} of ${rateLimit.rate.limit}`;
	output += `<br>Rate limit reset on: ${new Date((rateLimit.rate.reset + 1) * 1000)}`;
	output += `</small></p>`;

	// console.log(output);

	document.getElementById('output').innerHTML = output;
}

async function drawLandscape() {
	const dateNow = lastReloaded;
	const dateStr = new Date(dateNow);

	let output = ``;

	//  ========== HEADER ==========
	output += `<p><small>Last reloaded: ${dateStr}`;
	output += `<br>JSON last updated: ${new Date(jsonRepo.pushed_at)}`
	output += `<br><input type="checkbox" id="pauseReload">`;
	output += `<label for="pauseReload"> Pause Reload</label>`;
	output += `</small></p>`;

	output += `<table><tr>
		<th style="padding:5px;">Egg</th>
		<th style="padding:5px;">Dragons</th></tr>`;

	// ========== DRAGONS ==========
	let hidden = [];
	let unfinished = [];
	let dragonsDisplayed = 0;

	for (const breed of dragons) {
		if (dragonsDisplayed >= maxDisplay &&
			breed.view.length >= breed.adults &&
			breed.finished) {
			hidden.push(breed.id);
			continue;
		}

		if (dragonsDisplayed >= maxDisplay &&
			breed.view.length >= breed.adults) {
			unfinished.push(breed.id);
			continue;
		}

		output += `<tr>`;

		// ==== EGGS ====
		output += `<td style="padding:5px;">`;
		for (const egg in breeds[breed.id].name) {
			output += `<a href="${breeds[breed.id].encyclopedia}" target="_blank">`;
			output += `<img src="${breeds[breed.id].img[egg]}"`;
			output += `title="${breeds[breed.id].name[egg]}`;
			output += `\n${breeds[breed.id].description}" alt="${breeds[breed.id].name[egg]}">`;
			output += `</a>`;

			if (parseInt(egg) + 1 >= breeds[breed.id].name.length) continue;
			// landscape
			output += ` `;
		}
		output += `</td>`;

		// ==== DRAGONS ====	
		// View https://dragcave.net/image/r5HjG.gif
		output += `<td style="padding:5px;">`;
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

	if (unfinished.length > 0) {
		output += `<br><table><tbody>`
		output += `<tr><th style="padding:5px;">Unfinished</th></tr>`;
		output += `<tr><td style="padding:5px; line-height: 1;">`

		for (const id of unfinished) {
			for (const egg in breeds[id].name) {
				output += `<a href="${breeds[id].encyclopedia}" target="_blank">`
				output += `<img src="${breeds[id].img[egg]}"`;
				output += `title="${breeds[id].name[egg]}`;
				output += `\n${breeds[id].description}">`;
				output += `</a>`;
			}
			output += ` `;
		}
		output += `</td></tr>`;
		output += `</tbody></table>`;
	}

	if (hidden.length > 0) {
		output += `<br><table><tbody>`
		output += `<tr><th style="padding:5px;">Finished</th></tr>`;
		output += `<tr><td style="padding:5px; line-height: 1;">`;

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
		output += `</td></tr>`;
		output += `</tbody></table>`;
	}

	const rateLimit = await checkRateLimit();
	console.log(rateLimit);
	output += `<p id="rateLimit"><small>Rate limit remaining: ${rateLimit.rate.remaining} of ${rateLimit.rate.limit}`;
	output += `<br>Rate limit reset on: ${new Date((rateLimit.rate.reset + 1) * 1000)}`;
	output += `</small></p>`;

	document.getElementById('output').innerHTML = output;
}

const lastReloaded = Date.now();
setInterval(async () => {
	try {
		if (document.getElementById('pauseReload').checked) return;

		const dateNow = Date.now();

		if (dateNow - lastReloaded < 5 * 60 * 1000) return;

		const dateStr = new Date(dateNow);
		const dateMinutes = dateStr.getMinutes();
		// console.log(dateStr.getMinutes());

		if (dateMinutes % 10 !== 0) return;
		if (dateStr.getSeconds() !== 0) return;
		console.log('Check', dateStr);

		sessionStorage.setItem('scrollY', window.scrollY);

		await checkGitAPI();
		const pushed_at = jsonRepo.pushed_at;

		// if (gistLastUpdated !== update_at) await customReload();
		if (jsonLastPushed !== pushed_at) {
			sessionStorage.setItem('jsonRepo', JSON.stringify(jsonRepo));
			await customReload();
		}

		// if (dateNow - lastReloaded < 10 * 60 * 1000) return;

		if (dateMinutes % 30 === 0 && dateNow - lastReloaded >= 10 * 60 * 1000) await customReload();
		if (dateNow - lastReloaded >= 30 * 60 * 1000) await customReload();

		const rateLimit = await checkRateLimit();
		console.log(rateLimit);
		let output = `<small>Rate limit remaining: ${rateLimit.rate.remaining} of ${rateLimit.rate.limit}`;
		output += `<br>Rate limit reset on: ${new Date(rateLimit.rate.reset * 1000)}`;
		output += `</small>`;
		document.getElementById('rateLimit').innerHTML = output;
	} catch (err) {
		// console.error(err);
		document.getElementById('output').innerHTML = `<p>${err}<br>Reloading in 5 seconds</p>`;
		await sleep(5 * 1000);
		await customReload();
	}

}, 0.5 * 1000);

async function customReload() {
	location.reload();
	await sleep(1.5 * 1000);
}

window.onbeforeunload = function (event) {
	sessionStorage.setItem('scrollY', window.scrollY);
}

function sortDragons(a, b) {
	const aNew = a.id === '@new';
	const bNew = b.id === '@new';

	if (aNew !== bNew) return bNew - aNew;

	if (a.finished !== b.finished) return a.finished - b.finished;

	const aAllAdults = a.adults === a.view.length;
	const bAllAdults = b.adults === b.view.length;
	if (aAllAdults !== bAllAdults) return aAllAdults - bAllAdults;

	if (a.finished && b.finished && a.date !== b.date) return b.date - a.date;

	if (a.adults !== b.adults) return a.adults - b.adults;

	if (a.view.length !== b.view.length) return a.view.length - b.view.length;
	if (a.hatchlings !== b.hatchlings) return a.hatchlings - b.hatchlings;

	const aEggs = a.view.length - a.adults - a.hatchlings;
	const bEggs = b.view.length - b.adults - b.hatchlings;
	if (aEggs !== bEggs) return bEggs - aEggs;

	if (a.date !== b.date) return b.date - a.date;

	return a.id.localeCompare(b.id);
}
