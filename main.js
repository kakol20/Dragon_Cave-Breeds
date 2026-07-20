async function run() {
	const root = document.documentElement;

	const toggleThemeStore = sessionStorage.getItem('toggleTheme') === 'true';
	console.log(toggleThemeStore);

	if (toggleThemeStore) {
		root.style.colorScheme = 'light';
	} else {
		root.style.colorScheme = 'dark';
	}

	lastReloaded = Date.now();

	const mainResponse = await fetch('main.json');
	if (!mainResponse.ok) {
		throw new Error(`Error fetching main.json: ${mainResponse.status}`);
		document.getElementById('output').innerHTML = `Error fetching main.json: ${mainResponse.status}`;
		return;
	}
	main = await mainResponse.json();
	// console.log(main);

	jsonRepo = sessionStorage.getItem('jsonRepo');
	lastUnfinish_shown = sessionStorage.getItem('lastUnfinish_shown');

	if (jsonRepo && jsonRepo.name === 'main') {
		jsonRepo = JSON.parse(jsonRepo);
		console.log('Has jsonRepo Session Storage', jsonRepo, jsonRepo.commit.commit.committer.date);
	} else {
		await checkGitAPI();
		console.log('Has No jsonRepo Session Storage', jsonRepo, jsonRepo.commit.commit.committer.date);
		// console.log(gist);
	}
	jsonLastPushed = jsonRepo.commit.commit.committer.date;

	await getJSON();
	updateStats();
	await draw();

	const y = sessionStorage.getItem('scrollY');
	if (y) window.scrollTo(0, parseInt(y));

	if (toggleThemeStore) {
		document.getElementById('toggleTheme').checked = true;
	} else {
		document.getElementById('toggleTheme').checked = false;
	}
}

async function draw() {
	try {
		const portrait = window.matchMedia("(orientation: portrait)").matches;
		unfinished.length = 0;

		if (!portrait) {
			await drawLandscape();
		} else {
			await drawPortrait();
		}

		toggleHidden_unfinished(lastUnfinish_shown);
	} catch (err) {
		document.getElementById('output').innerHTML = `${err}<br>Reloading in 5 seconds`;
		await sleep(5 * 1000);
		customReload();
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

window.matchMedia("(orientation: portrait)").addEventListener("change", async e => {
	await draw();
});

const unfinished = [];
let lastUnfinish_shown = 'none';

const portrait_td_style = `padding-left:2px;padding-right: 2px;padding-top: 1px; padding-bottom: 1px;`;
async function drawPortrait() {
	const dateNow = lastReloaded;
	const dateStr = new Date(dateNow);

	let output = ``;
	let unfinishedOutput = '';

	//  ========== HEADER ==========
	output += '<p><small>';
	output += `<span style="display: inline-flex;gap: 4px;margin-right: 16px;margin-top: 2px;">`;
	output += `<input type="checkbox" id="pauseReload">`;
	output += `<label for="pauseReload"> Pause Reload</label></span>`;
	output += `<span style="display: inline-flex;gap: 4px;margin-right: 20px;margin-top: 2px;">`;
	output += `<input type="checkbox" id="toggleTheme" onclick="toggleTheme()">`;
	output += `<label for="toggleTheme"> Toggle Theme</label></span>`;
	output += `</small></p>`;

	output += `<table style="width:100%"><tr>
		<th style="padding:5px;">Egg</th>
		<th style="padding:5px;">Dragons</th></tr>`;

	// ========== DRAGONS ==========
	const hidden = [];
	let imagesDisplayed = 0;

	let lastDragon = 'none';
	for (let i = 0; i < dragons.length; ++i) {
		const breed = dragons[i];

		if (imagesDisplayed >= maxDisplay &&
			breed.view.length >= breed.adults &&
			breed.finished) continue;
		if (imagesDisplayed >= maxDisplay &&
			breed.view.length === breed.adults) continue;

		lastDragon = dragons[i].id;
		// for (const dragon of breed.view) ++imagesDisplayed;
		imagesDisplayed += breed.view.length;
		imagesDisplayed += breeds[breed.id].name.length;
	}
	console.log('Last dragon', lastDragon);
	imagesDisplayed = 0;

	for (const breed of dragons) {
		if (imagesDisplayed >= maxDisplay &&
			breed.view.length >= breed.adults &&
			breed.finished) {
			hidden.push(breed.id);
			continue;
		}

		if (imagesDisplayed >= maxDisplay &&
			breed.view.length === breed.adults) {
			// hidden.push(breed.id);

			unfinished.push(breed.id);

			unfinishedOutput += `<table id="${breed.id}_hide" hidden>`;
			unfinishedOutput += `<tr><th style="padding:5px;" colspan="2">${breeds[breed.id].description}</th></tr>`;

			// ==== EGGS ====
			for (const egg in breeds[breed.id].name) {
				unfinishedOutput += `<tr>`

				unfinishedOutput += `<td style="${portrait_td_style}border-bottom-right-radius:0;"><a href="${breeds[breed.id].encyclopedia}" target="_blank">`;
				unfinishedOutput += customImgElement(breeds[breed.id].img[egg], breeds[breed.id].name[egg], breeds[breed.id].name[egg]);
				unfinishedOutput += `</a></td>`;

				// ==== DRAGONS ====
				if (egg === '0') {
					unfinishedOutput += `<td rowspan="${breeds[breed.id].name.length}" style="${portrait_td_style}border-bottom-right-radius:5px;">`;

					for (const dragon of breed.view) {
						unfinishedOutput += `<a href="https://dragcave.net/view/${dragon}" target="_blank">`;
						unfinishedOutput += customImgElement(`https://dragcave.net/image/${dragon}.gif`, dragon, dragon);
						unfinishedOutput += `</a> `;
					}

					unfinishedOutput += `</td>`;
					// console.log('Hit');
				}

				unfinishedOutput += `</tr>`;
			}

			unfinishedOutput += `</table>`;
			continue;
		}

		// ==== EGGS ====
		for (const egg in breeds[breed.id].name) {
			output += `<tr>`

			output += `<td style="${portrait_td_style}"><a href="${breeds[breed.id].encyclopedia}" target="_blank">`;
			output += customImgElement(breeds[breed.id].img[egg],
				breeds[breed.id].name[egg],
				`${breeds[breed.id].name[egg]}\n${breeds[breed.id].description}`);
			output += `</a></td>`;

			// ==== DRAGONS ====
			if (egg === '0') {
				if (breed.id === lastDragon) {
					output += `<td rowspan="${breeds[breed.id].name.length}" style="${portrait_td_style}border-bottom-right-radius: 5px;">`;
				} else {
					output += `<td rowspan="${breeds[breed.id].name.length}" style="${portrait_td_style}">`;
				}

				for (const dragon of breed.view) {
					output += `<a href="https://dragcave.net/view/${dragon}" target="_blank">`;
					output += customImgElement(`https://dragcave.net/image/${dragon}.gif`, dragon, dragon);
					output += `</a> `;
					++imagesDisplayed;
				}

				output += `</td>`;
				// console.log('Hit');
			}
			++imagesDisplayed;
			output += `</tr>`
		}
	}
	output += `</table>`;

	console.log('Images displayed on main table', imagesDisplayed);

	if (unfinished.length > 0) {
		output += `<br><table>`
		output += `<tr><th style="padding:5px;">Unfinished</th></tr>`;
		output += `<tr><td style="${portrait_td_style}border-bottom-right-radius: 5px;">`

		for (const id of unfinished) {
			for (const egg in breeds[id].name) {
				output += `<a onclick="toggleHidden_unfinished('${id}')">`;
				output += customImgElement(breeds[id].img[egg],
					breeds[id].name[egg],
					`${breeds[id].name[egg]}\n${breeds[id].description}`);
				output += `</a>`;
			}
			output += ` `;
		}
		output += `</td></tr>`;
		output += `</table>`;
	}
	output += unfinishedOutput;

	output += drawHidden_finished(hidden, portrait_td_style, true);

	output += `<p><small>Last Reloaded: ${dateStr}`;
	output += `<br>JSON Last Updated: ${new Date(jsonRepo.commit.commit.committer.date)}`;
	output += `<br>${getCommitMessage()}`;
	output += `<br>${nextUpdatePredicted()}`;
	output += `</small></p>`;

	const rateLimit = await checkRateLimit();
	console.log(rateLimit);
	output += `<p id="rateLimit"><small>Rate Limit Remaining: ${rateLimit.rate.remaining} of ${rateLimit.rate.limit}`;
	output += `<br>Rate Limit Reset On: ${new Date((rateLimit.rate.reset + 1) * 1000)}`;
	output += `</small></p>`;

	document.getElementById('output').innerHTML = output;
}
const landscape_td_style = `padding-left:5px;padding-right: 5px;padding-top: 4px; padding-bottom: 4px;`;
async function drawLandscape() {
	const dateNow = lastReloaded;
	const dateStr = new Date(dateNow);

	let output = ``;

	//  ========== HEADER ==========
	output += '<p><small>';
	output += `<span style="display: inline-flex;gap: 4px;margin-right: 16px;margin-top: 2px;">`;
	output += `<input type="checkbox" id="pauseReload">`;
	output += `<label for="pauseReload"> Pause Reload</label></span>`;
	output += `<span style="display: inline-flex;gap: 4px;margin-right: 20px;margin-top: 2px;">`;
	output += `<input type="checkbox" id="toggleTheme" onclick="toggleTheme()">`;
	output += `<label for="toggleTheme"> Toggle Theme</label></span>`;
	output += `</small></p>`;

	output += `<table><tr>
		<th style="padding:5px;">Egg</th>
		<th style="padding:5px;">Dragons</th></tr>`;

	// ========== DRAGONS ==========
	const hidden = [];
	let imagesDisplayed = 0;

	let lastDragon = 'none';
	for (let i = 0; i < dragons.length; ++i) {
		const breed = dragons[i];

		if (imagesDisplayed >= maxDisplay &&
			breed.view.length >= breed.adults &&
			breed.finished) continue;
		if (imagesDisplayed >= maxDisplay &&
			breed.view.length === breed.adults) continue;

		lastDragon = dragons[i].id;
		// for (const dragon of breed.view) ++dragonsDisplayed;
		imagesDisplayed += breed.view.length;
		imagesDisplayed += breeds[breed.id].name.length;
	}
	console.log('Last dragon', lastDragon);
	imagesDisplayed = 0;

	let unfinishedOutput = '';

	for (const breed of dragons) {
		if (imagesDisplayed >= maxDisplay &&
			breed.view.length >= breed.adults &&
			breed.finished) {
			hidden.push(breed.id);
			continue;
		}

		if (imagesDisplayed >= maxDisplay &&
			breed.view.length >= breed.adults) {
			unfinished.push(breed.id);

			unfinishedOutput += `<table id="${breed.id}_hide" hidden>`;
			unfinishedOutput += `<tr><th style="padding:5px;" colspan="2">${breeds[breed.id].description}</th></tr>`;

			// ==== EGGS ====
			unfinishedOutput += `<tr><td style="${landscape_td_style}">`;

			for (const egg in breeds[breed.id].name) {
				unfinishedOutput += `<a href="${breeds[breed.id].encyclopedia}" target="_blank">`;
				unfinishedOutput += customImgElement(breeds[breed.id].img[egg], breeds[breed.id].name[egg],
					`${breeds[breed.id].name[egg]}\n${breeds[breed.id].description}`);
				unfinishedOutput += `</a>`;

				if (parseInt(egg) + 1 >= breeds[breed.id].name.length) continue;
				// landscape
				unfinishedOutput += ` `;
			}
			unfinishedOutput += `</td>`;

			// ==== DRAGONS ====	
			// View https://dragcave.net/image/r5HjG.gif
			unfinishedOutput += `<td style="${landscape_td_style}border-bottom-right-radius: 5px;">`;
			for (const dragon of breed.view) {
				unfinishedOutput += `<a href="https://dragcave.net/view/${dragon}" target="_blank">`;
				unfinishedOutput += customImgElement(`https://dragcave.net/image/${dragon}.gif`, dragon, dragon);
				unfinishedOutput += `</a> `;
			}
			// End
			unfinishedOutput += `</td></tr>`;

			unfinishedOutput += `</table>`;
			continue;
		}

		output += `<tr>`;

		// ==== EGGS ====
		output += `<td style="${landscape_td_style}">`;
		for (const egg in breeds[breed.id].name) {
			output += `<a href="${breeds[breed.id].encyclopedia}" target="_blank">`;
			output += customImgElement(breeds[breed.id].img[egg], breeds[breed.id].name[egg],
				`${breeds[breed.id].name[egg]}\n${breeds[breed.id].description}`);
			output += `</a>`;

			++imagesDisplayed;
			if (parseInt(egg) + 1 >= breeds[breed.id].name.length) continue;
			// landscape
			output += ` `;
		}
		output += `</td>`;

		// ==== DRAGONS ====	
		// View https://dragcave.net/image/r5HjG.gif
		if (breed.id === lastDragon) {
			output += `<td style="${landscape_td_style}border-bottom-right-radius: 5px;">`;
		} else {
			output += `<td style="${landscape_td_style}">`;
		}
		for (const dragon of breed.view) {
			output += `<a href="https://dragcave.net/view/${dragon}" target="_blank">`;
			output += customImgElement(`https://dragcave.net/image/${dragon}.gif`, dragon, dragon);
			output += `</a> `;
			++imagesDisplayed;
		}
		// End
		output += `</td></tr>`;
	}
	output += `</table>`;

	// console.log('==========')
	console.log('Dragons displayed', imagesDisplayed);

	if (unfinished.length > 0) {
		output += `<br><table>`
		output += `<tr><th style="padding:5px;">Unfinished</th></tr>`;
		output += `<tr><td style="${landscape_td_style}border-bottom-right-radius: 5px;">`

		for (const id of unfinished) {
			for (const egg in breeds[id].name) {
				output += `<a onclick="toggleHidden_unfinished('${id}')">`;
				output += customImgElement(breeds[id].img[egg], breeds[id].name[egg],
					`${breeds[id].name[egg]}\n${breeds[id].description}`);
				output += `</a>`;
			}
			output += ` `;
		}
		output += `</td></tr>`;
		output += `</table>`;
	}
	output += unfinishedOutput;

	output += drawHidden_finished(hidden, landscape_td_style);

	output += `<p><small>Last Reloaded: ${dateStr}`;
	output += `<br>JSON Last Updated: ${new Date(jsonRepo.commit.commit.committer.date)}`;
	output += `<br>${getCommitMessage()}`;
	output += `<br>${nextUpdatePredicted()}`;
	output += `</small></p>`;

	const rateLimit = await checkRateLimit();
	console.log(rateLimit);
	output += `<p id="rateLimit"><small>Rate Limit Remaining: ${rateLimit.rate.remaining} of ${rateLimit.rate.limit}`;
	output += `<br>Rate Limit Reset On: ${new Date((rateLimit.rate.reset + 1) * 1000)}`;
	output += `</small></p>`;

	document.getElementById('output').innerHTML = output;
}

function toggleHidden_unfinished(id) {
	lastUnfinish_shown = id;
	if (unfinished.length <= 0) return;
	for (const tag of unfinished) {
		const elementId = `${tag}_hide`;
		if (id === tag) {
			document.getElementById(elementId).hidden = false;
		} else {
			document.getElementById(elementId).hidden = true;
		}
	}
}

let hidden_pageShown = 0;
function drawHidden_finished(hidden, style, fullWidth = false) {
	if (hidden.length <= 0) return '';

	const hidden_maxDisplay = 50;
	const maxPages = Math.ceil(hidden.length / hidden_maxDisplay);

	let output = '<br>';

	for (let page = 0; page < maxPages; ++page) {
		const maxIndex = Math.min(hidden.length, (page + 1) * hidden_maxDisplay);
		console.log('Page', page);

		output += `<table id="hidden_page${page}" ${page === hidden_pageShown ? '' : 'hidden'} ${fullWidth ? `style="width:100%"` : ''}>`;
		output += `<tr><th colspan="3" style="padding:5px;">Finished</th></tr>`;
		output += `<tr><td colspan="3" style="${style}">`;
		for (let i = page * hidden_maxDisplay; i < maxIndex; ++i) {
			const id = hidden[i];
			for (const egg in breeds[id].name) {
				output += `<a href="${breeds[id].encyclopedia}" target="_blank">`;
				output += customImgElement(breeds[id].img[egg], breeds[id].name[egg],
					`${breeds[id].name[egg]}\n${breeds[id].description}`);
				output += `</a>`;
			}
			output += ` `;
		}
		output += `</td></tr>`;

		// ==== Page Navigation ====
		const previousPage = Math.max(0, page - 1);
		const nextPage = Math.min(maxPages - 1, page + 1);

		output += '<tr>';

		if (previousPage === page) {
			output += `<td style="padding:5px;">
				<a href="javascript:void(0);" class="isDisabled" onclick="hidden_switchPage(${previousPage}, ${maxPages})" style="padding:5px;">Back</a>
			</td>`;
		} else {
			output += `<td style="padding:5px;">
				<a href="javascript:void(0);" onclick="hidden_switchPage(${previousPage}, ${maxPages})" style="padding:5px;">Back</a>
			</td>`;
		}

		output += `<td style="padding:5px;">${page * hidden_maxDisplay + 1} to ${maxIndex} of ${maxIndex}</td>`;

		if (nextPage === page) {
			output += `<td style="padding:5px;border-bottom-right-radius: 5px;">
				<a href="javascript:void(0);" class="isDisabled" onclick="hidden_switchPage(${nextPage}, ${maxPages})" style="padding:5px;">Next</a>
			</td>`;
		} else {
			output += `<td style="padding:5px;border-bottom-right-radius: 5px;">
				<a href="javascript:void(0);" onclick="hidden_switchPage(${nextPage}, ${maxPages})" style="padding:5px;">Next</a>
			</td>`;
		}

		output += '</tr></table>';
	}
	return output;
}

function hidden_switchPage(page, maxPages) {
	// console.log(page, maxPages);
	hidden_pageShown = page;

	for (let i = 0; i < maxPages; ++i) {
		const id = `hidden_page${i}`;

		if (i === page) {
			document.getElementById(id).hidden = false;
		} else {
			document.getElementById(id).hidden = true;
		}
	}
}