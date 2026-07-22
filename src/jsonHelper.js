
let main = {};
async function getMainJson(debug = false) {
	// console.log('Trying to get main json');
	const response = await fetch('main.json');
	if (!response.ok) {
		document.getElementById('output').innerHTML = `Error fetching main.json: ${response.status}`;
		throw new Error(`Error fetching main.json: ${response.status}`);
		return;
	}
	main = await response.json();
	if (debug) console.log('main', main);
}

let player = [];
async function getPlayerJson(debug = false) {
	const response = await fetch(main.player, { cache: 'no-store' });
	if (!response.ok) {
		document.getElementById('output').innerHTML = `Error fetching player.json: ${response.status}`;
		throw new Error(`Error fetching player.json: ${response.status}`);
		return;
	}
	player = await response.json();
	player.sort(sortPlayer);
	if (debug) console.log('player', player);
}

function sortPlayer(a, b) {
	const aNew = a.id.includes('@new');
	const bNew = b.id.includes('@new');
	if (aNew !== bNew) return bNew - aNew;

	const aAllAdults = a.adults === a.view.length;
	const bAllAdults = b.adults === b.view.length;
	if (aAllAdults !== bAllAdults) return aAllAdults - bAllAdults;

	if (a.finished !== b.finished) return a.finished - b.finished;

	if (a.finished && b.finished && a.date !== b.date) return b.date - a.date;

	if (a.adults !== b.adults) return a.adults - b.adults;

	if (a.view.length !== b.view.length) return a.view.length - b.view.length;
	if (a.hatch !== b.hatch) return a.hatch - b.hatch;

	const aEggs = a.view.length - a.adults - a.hatch;
	const bEggs = b.view.length - b.adults - b.hatch;
	if (aEggs !== bEggs) return bEggs - aEggs;

	if (a.date !== b.date) return b.date - a.date;

	return a.id.localeCompare(b.id);
}

let breeds = {};
async function getBreedsJson(debug = false) {
	const response = await fetch(main.breeds, { cache: 'no-store' });
	if (!response.ok) {
		document.getElementById('output').innerHTML = `Error fetching breeds.json: ${response.status}`;
		throw new Error(`Error fetching breeds.json: ${response.status}`);
		return;
	}
	breeds = await response.json();
	if (debug) console.log('breeds', breeds);
}

let rateLimit = {};
let rateLimitReset = 0;
async function checkRateLimit(debug = false) {
	const response = await fetch('https://api.github.com/rate_limit', { cache: 'no-store' });
	if (!response.ok) {
		document.getElementById('output').innerHTML = `Error fetching rate limit: 
			<a href="https://api.github.com/rate_limit" target="_blank">https://api.github.com/rate_limit</a>`;
		throw new Error(`Error fetching rate limit: https://api.github.com/rate_limit`);
		return;
	}
	rateLimit = await response.json();
	rateLimitReset = rateLimit.rate.reset * 1000;
	if (debug) {
		// rateLimit.rate.remaining
		console.log('Rate Limit', rateLimit);
		console.log('Rate Limit Remaning', rateLimit.rate.remaining);
		console.log('Rate Limit Reset', new Date(rateLimitReset));
	}
}

let jsonRepo;
let jsonLastCommitDate = new Date();
let jsonLastCommit = 0;
let jsonCommitMsg = '';
async function getJsonRepo(begin = false, debug = false) {
	if (begin) {
		jsonRepo = sessionStorage.getItem('jsonRepo');

		if (jsonRepo) {
			jsonRepo = JSON.parse(jsonRepo);
			jsonLastCommitDate = new Date(jsonRepo.commit.commit.committer.date);
			jsonLastCommit = jsonLastCommitDate.getTime();

			if (debug) {
				console.log('Has session storage');
				console.log('jsonRepo', jsonRepo);
				console.log('jsonLastCommitDate', jsonLastCommitDate);
				console.log('jsonLastCommit', jsonLastCommit);
			}
		}
	}

	await checkRateLimit(debug);

	if (rateLimit.rate.remaining <= 0) {
		if (debug) console.log('Rate limit reached zero');
		return;
	}

	const response = await fetch(main.jsonRepo, { cache: 'no-store' });
	if (!response.ok) {
		document.getElementById('output').innerHTML = `Error fetching jsonRepo: ${response.status}`;
		throw new Error(`Error fetching jsonRepo: ${response.status}`);
		return;
	}
	jsonRepo = await response.json();
	jsonLastCommitDate = new Date(jsonRepo.commit.commit.committer.date);
	jsonLastCommit = jsonLastCommitDate.getTime();

	if (debug) {
		console.log('jsonRepo', jsonRepo);
		console.log('jsonLastCommitDate', jsonLastCommitDate);
		console.log('jsonLastCommit', jsonLastCommit);
	}

	sessionStorage.setItem('jsonRepo', JSON.stringify(jsonRepo));
}
