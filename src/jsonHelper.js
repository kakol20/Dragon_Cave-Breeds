
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
	rateLimitReset = (rateLimit.rate.reset + 1) * 1000;
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
			generateCommitMsg();
			console.log('Has session storage');

			if (debug) {
				console.log('jsonRepo', jsonRepo);
				console.log('jsonLastCommitDate', jsonLastCommitDate);
				console.log('jsonLastCommit', jsonLastCommit);
			}

			await checkRateLimit(debug);
			return;
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
	generateCommitMsg();

	if (debug) {
		console.log('jsonRepo', jsonRepo);
		console.log('jsonLastCommitDate', jsonLastCommitDate);
		console.log('jsonLastCommit', jsonLastCommit);
	}

	sessionStorage.setItem('jsonRepo', JSON.stringify(jsonRepo));
}

function generateCommitMsg() {
	let output = `<span style="text-indent: 2em each-line;display:inline-block;font-style: italic;">`;

	const commitArr = jsonRepo.commit.commit.message.split('\n').filter(Boolean);
	for (let i = 0; i < commitArr.length; ++i) {
		if (i === 0) output += `<span style="font-weight:bold;">`;

		output += commitArr[i];

		if (i === 0) output += `</span>`;

		if (i + 1 < commitArr.length) output += '<br>';
	}
	output += '</span>';
	// console.log(commitArr);
	jsonCommitMsg = output;
}

function nextUpdatePredicted() {
	const one_year = 1000 * 60 * 60 * 24 * 365;
	let nextDate = Date.now() + one_year;
	for (const breed of player) {
		if (breed.view.length === breed.adults) continue;
		const dateStr = breed.date.toFixed(4);
		const yearStr = dateStr.substring(0, 4);
		const monthStr = dateStr.substring(4, 6);
		const dayStr = dateStr.substring(6, 8);
		const hourStr = dateStr.substring(9, 11);
		const minStr = dateStr.substring(11, 13);

		const fullDateInit = `${yearStr} ${monthStr} ${dayStr} ${hourStr}:${minStr} EDT`;
		const fullDateStr = new Date(fullDateInit);
		const fullDateTime = fullDateStr.getTime() + (3 * 86400 * 1000);

		if (fullDateTime < nextDate) nextDate = fullDateTime;
	}

	return `Next Update Predicted: ${new Date(nextDate)}`;
}