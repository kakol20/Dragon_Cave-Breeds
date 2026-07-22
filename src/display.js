
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

	let output = mainTable(portrait);

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

const unfinished = [];
const finished = [];

let unfinishedOutput = '';
let lastUnfinish_shown = 'none';

function mainTable(portrait = false) {
	const tdStyle = portrait ? portrait_td_style : landscape_td_style;

	unfinished.length = 0;
	finished.length = 0;

	// ========== MAIN TABLE ==========
	let output = `<table ${portrait ? 'style="width:100%"' : ''}>`;
	output += `<tr><th style="padding:5px;">Egg</th>
		<th style="padding:5px;">Dragons</th></tr>`;
	output += drawDragons(portrait);
	output += '</table>';

	// ========== UNFINISHED ==========
	if (unfinished.length > 0) {
		output += `<br><table>`
		output += `<tr><th style="padding:5px;">Unfinished</th></tr>`;

		output += `<tr><td style="${tdStyle}border-bottom-right-radius: 5px;">`;

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

	// ========== FINISHED ==========
	output += drawHidden_finished(tdStyle, portrait);

	return output;
}

const portrait_td_style = `padding-left:2px;padding-right: 2px;padding-top: 1px; padding-bottom: 1px;`;
const landscape_td_style = `padding-left:5px;padding-right: 5px;padding-top: 4px; padding-bottom: 4px;`;

const mainTableLimit = 50;
function drawDragons(portrait = false) {
	// ========== TRACK LAST DRAGON TO DISPLAY ==========

	let output = '';
	let imagesDisplayed = 0;

	let lastDragon = 'none';
	for (let i = 0; i < player.length; ++i) {
		const breed = player[i];

		if (breed.view.length >= breed.adults &&
			breed.finished) continue;
		if (imagesDisplayed >= mainTableLimit &&
			breed.view.length === breed.adults) continue;

		lastDragon = player[i].id;
		imagesDisplayed += breed.view.length;
		imagesDisplayed += breeds[breed.id].name.length;
	}
	console.log('Last dragon', lastDragon);
	imagesDisplayed = 0;

	// ========== MAIN DISPLAY ==========

	for (const breed of player) {
		if (breed.view.length >= breed.adults && breed.finished) {
			finished.push(breed.id);
			continue;
		}
		if (imagesDisplayed >= mainTableLimit && breed.view.length === breed.adults) {
			unfinished.push(breed.id);
			unfinishedOutput += drawUnfinished(portrait, breed);
			continue;
		}

		if (portrait) {
			// ==== EGGS ====
			for (const egg in breeds[breed.id].name) {
				output += `<tr>`;
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

					output += showIndivDragons(breed);
					output += `</td>`;
				}
				output += `</tr>`
			}
		} else {
			// ==== EGGS ====
			output += `<tr>`;
			output += `<td style="${landscape_td_style}">`;
			for (const egg in breeds[breed.id].name) {
				output += `<a href="${breeds[breed.id].encyclopedia}" target="_blank">`;
				output += customImgElement(breeds[breed.id].img[egg], breeds[breed.id].name[egg],
					`${breeds[breed.id].name[egg]}\n${breeds[breed.id].description}`);
				output += `</a>`;

				if (parseInt(egg) + 1 >= breeds[breed.id].name.length) continue;
				output += ` `;
			}
			output += `</td>`;

		}

		imagesDisplayed += breed.view.length;
		imagesDisplayed += breeds[breed.id].name.length;
	}

	return output;
}

function drawUnfinished(portrait = false, breed) {
	let output = '';

	if (portrait) {
		output += `<table id="${breed.id}_hide" hidden>`;
		// output += `<table id="${breed.id}_hide">`;
		output += `<tr><th style="padding:5px;" colspan="2">${breeds[breed.id].description}</th></tr>`;

		// ==== EGGS ====

		for (const egg in breeds[breed.id].name) {
			output += '<tr>';
			output += `<td style="${portrait_td_style}border-bottom-right-radius:0;"><a href="${breeds[breed.id].encyclopedia}" target="_blank">`;
			output += customImgElement(breeds[breed.id].img[egg], breeds[breed.id].name[egg], breeds[breed.id].name[egg]);
			output += `</a></td>`;

			// ==== DRAGONS ====
			if (egg === '0') {
				output += `<td rowspan="${breeds[breed.id].name.length}" style="${portrait_td_style}border-bottom-right-radius:5px;">`;
				output += showIndivDragons(breed);
				output += `</td>`;
			}
			output += `</tr>`;
		}
		output += `</table>`;
	}

	return output;
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

function showIndivDragons(breed) {
	let output = '';
	for (const dragon of breed.view) {
		output += `<a href="https://dragcave.net/view/${dragon}" target="_blank">`;
		output += customImgElement(`https://dragcave.net/image/${dragon}.gif`, dragon, dragon);
		output += `</a> `;
	}
	return output;
}

let finished_pageShown = 0;
function drawHidden_finished(style, fullWidth = false) {
	if (finished.length <= 0) return '';

	const finished_maxDisplay = 50;
	const maxPages = Math.ceil(finished.length / finished_maxDisplay);

	let output = '<br>';

	for (let page = 0; page < maxPages; ++page) {
		const maxIndex = Math.min(finished.length, (page + 1) * finished_maxDisplay);
		// console.log('Page', page);

		output += `<table id="hidden_page${page}" ${page === finished_pageShown ? '' : 'hidden'} ${fullWidth ? `style="width:100%"` : ''}>`;
		output += `<tr><th colspan="3" style="padding:5px;">Finished</th></tr>`;
		output += `<tr><td colspan="3" style="${style}">`;
		for (let i = page * finished_maxDisplay; i < maxIndex; ++i) {
			const id = finished[i];
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

		output += `<td style="padding:5px;">${page * finished_maxDisplay + 1} to ${maxIndex} of ${maxIndex}</td>`;

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
	finished_pageShown = page;

	for (let i = 0; i < maxPages; ++i) {
		const id = `hidden_page${i}`;

		if (i === page) {
			document.getElementById(id).hidden = false;
		} else {
			document.getElementById(id).hidden = true;
		}
	}
}

async function orientationChange() {
	console.log('orientation change');
}