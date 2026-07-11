let main;
let dragons;
let breeds;

let jsonLastPushed;
let jsonRepo = null;

const maxDisplay = 75;

async function checkGitAPI() {
	const rate_limit = await checkRateLimit();

	if (rate_limit.rate.remaining <= 0) return;

	jsonRepo = await fetch(`${main.jsonRepo}`, {
		cache: 'no-store'
	}).then(r => r.json());
	// console.log(gist);

	sessionStorage.setItem('jsonRepo', JSON.stringify(jsonRepo));
}

function updateStats() {
	// 53 pre 2026 Adults not in JSON file + 1 Leetle Tree
	const extraAdults = 54;

	let eggs = 0, hatch = 0, adult = 0, total = 0;

	for (const breed of dragons) {
		console.log(breed);
		const currentAdult = breed.adults;
		const currentHatch = breed.hatchlings;
		const currentEggs = breed.view.length - currentAdult - currentHatch;

		eggs += currentEggs;
		hatch += currentHatch;
		adult += currentAdult;
		total += breed.view.length;
	}

	adult += extraAdults;
	total += extraAdults;

	document.getElementById('stats_eggs').innerHTML = eggs;
	document.getElementById('stats_hatch').innerHTML = hatch;
	document.getElementById('stats_adult').innerHTML = adult;
	document.getElementById('stats_total').innerHTML = total;
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

function customReload() {
	sessionStorage.setItem('scrollY', window.scrollY);
	sessionStorage.setItem('lastUnfinish_shown', lastUnfinish_shown);
	// console.trace();
	const dateNow = Date.now();
	console.log(dateNow, lastReloaded, dateNow - lastReloaded < 1 * 60 * 1000);
	if (dateNow - lastReloaded < 1 * 60 * 1000) return;

	clearInterval(reloadInterval);
	location.reload();
}

function toggleTheme() {
	// console.log(document.getElementById('toggleTheme').checked);

	sessionStorage.setItem('toggleTheme', document.getElementById('toggleTheme').checked);

	const root = document.documentElement;

	if (document.getElementById('toggleTheme').checked) {
		root.style.colorScheme = 'light'; 
		return;
	}

	root.style.colorScheme = 'dark';
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

let lastReloaded = Date.now();
const reloadInterval = setInterval(async () => {
	try {
		if (document.getElementById('pauseReload')?.checked) return;

		const dateNow = Date.now();

		if (dateNow - lastReloaded < 5 * 60 * 1000) return;
		// console.log(dateNow, lastReloaded, dateNow - lastReloaded < 5 * 60 * 1000);

		const dateStr = new Date(dateNow);
		const dateMinutes = dateStr.getMinutes();
		// console.log(dateStr.getMinutes());

		if (dateMinutes % 10 !== 0) return;
		if (dateStr.getSeconds() !== 0) return;
		console.log('Check', dateStr);

		sessionStorage.setItem('scrollY', window.scrollY);

		await checkGitAPI();
		const pushed_at = jsonRepo.pushed_at;

		// if (gistLastUpdated !== update_at) customReload();
		if (jsonLastPushed !== pushed_at) {
			sessionStorage.setItem('jsonRepo', JSON.stringify(jsonRepo));
			customReload();
		}

		// if (dateNow - lastReloaded < 10 * 60 * 1000) return;

		if (dateMinutes % 30 === 0 && dateNow - lastReloaded >= 10 * 60 * 1000) customReload();
		if (dateNow - lastReloaded >= 30 * 60 * 1000) customReload();

		const rateLimit = await checkRateLimit();
		console.log(rateLimit);
		let output = `<small>Rate limit remaining: ${rateLimit.rate.remaining} of ${rateLimit.rate.limit}`;
		output += `<br>Rate limit reset on: ${new Date(rateLimit.rate.reset * 1000)}`;
		output += `</small>`;
		document.getElementById('rateLimit').innerHTML = output;
	} catch (err) {
		console.error(err);
		document.getElementById('output').innerHTML = `<p>${err}<br>Reloading in 5 seconds</p>`;
		await sleep(5 * 1000);
		customReload();
	}

}, 0.5 * 1000);
