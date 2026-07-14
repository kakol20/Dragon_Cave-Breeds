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
		// console.log(breed);
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
	// document.getElementById('stats_total').innerHTML = total;
	document.getElementById('stats_total').innerHTML = `<span 
		onclick="document.getElementById('stats_group').hidden = !(document.getElementById('stats_group')?.hidden)">
			${total}</span>`;

	// ========== GROUP COUNT ==========

	const eggLimit = 
		adult >= 1000 ? 8 : 
		adult >= 500 ? 7 :
		adult >= 200 ? 6 :
		adult >= 50 ? 5 : 4;
	const totalLimit = eggLimit * 3;

	/*
	const group3 = Math.ceil((total + 1) / totalLimit) * totalLimit;
	const group2 = group3 - eggLimit;
	const group1 = group2 - eggLimit;
	*/
	const group1 = Math.ceil((total + 1) / eggLimit) * eggLimit;
	const group2 = group1 + eggLimit;
	const group3 = group2 + eggLimit;

	// console.log(group1, group2, group3);

	document.getElementById('stats_g1').innerHTML = group1;
	document.getElementById('stats_g2').innerHTML = group2;
	document.getElementById('stats_g3').innerHTML = group3;
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

function customImgElement(src = ' ', alt = ' ', title = ' ') {
	if (src === ' ') return '';

	if (title === ' ') return `<img src="${src}" ${alt === ' ' ? '' : `alt="${alt}"`}>`;

	return `<span class="tooltip" data-title="${title}">
		<img src="${src}" ${alt === ' ' ? '' : `alt="${alt}"`}>
	</span>`;
}

document.addEventListener("pointerover", e => {
	const element = e.target.closest(".tooltip");

	if (!element || element._tooltip || element.contains(e.relatedTarget))return;

	const tooltip = document.createElement("div");
	tooltip.className = "tooltip-box";
	tooltip.textContent = element.dataset.title;

	document.body.appendChild(tooltip);

	const rect = element.getBoundingClientRect();

	const viewportWidth = document.documentElement.clientWidth;
	const viewportHeight = document.documentElement.clientHeight;

	// Set initial position
	let x = rect.left;
	let y = rect.bottom + 5;

	tooltip.style.left = `${x}px`;
	tooltip.style.top = `${y}px`;

	// Limit width so it can wrap on narrow screens
	tooltip.style.maxWidth = `${viewportWidth - 20}px`;

	// Measure after layout
	let tooltipRect = tooltip.getBoundingClientRect();

	// Move left if outside right edge
	if (tooltipRect.right > viewportWidth - 10) x = viewportWidth - tooltipRect.width - 10;

	// Prevent going outside left edge
	if (x < 10) x = 10;

	// Move above if outside bottom edge
	if (tooltipRect.bottom > viewportHeight - 10) y = rect.top - tooltipRect.height - 5;

	// Prevent going outside top edge
	if (y < 10) y = 10;

	tooltip.style.left = `${x}px`;
	tooltip.style.top = `${y}px`;

	element._tooltip = tooltip;
});

document.addEventListener("pointerout", e => {
	const element = e.target.closest(".tooltip");

	if (!element || element.contains(e.relatedTarget)) return;

	element._tooltip?.remove();
	element._tooltip = null;
});

function nextUpdatePredicted() {
	let nextDate = Date.now() + (1000*60*60*24*365);
	for (const breed of dragons) {
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

		if (fullDateTime < nextDate) {
			nextDate = fullDateTime;
			// console.log(breed);
		}
	}

	const dateStr = new Date(nextDate);

	return `Next Update Predicted: ${dateStr}`;
}
