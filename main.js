async function run() {
	let output = '';

	const mainResponse = await fetch('main.json');
	if (!mainResponse.ok) {
		throw new Error(`Error fetching main.json: ${mainResponse.staus}`);
		document.getElementById('output').innerHTML = `Error fetching main.json: ${mainResponse.staus}`;
		return;
	}
	const main = await mainResponse.json();
	console.log(main);

	const playerResponse = await fetch(main.player);
	if (!playerResponse.ok) {
		throw new Error(`Error fetching main.player json file: ${playerResponse.status}`);
		document.getElementById('output').innerHTML = `Error fetching main.player json file: ${playerResponse.status}`;
		return;
	}
	const player = await playerResponse.json();
	player.dragons.sort(sortDragons);
	console.log(player);

	const breedsResponse = await fetch(main.breeds);
	if (!breedsResponse.ok) {
		throw new Error(`Error fetching main.breeds json file: ${breedsResponse.status}`);
		document.getElementById('output').innerHTML = `Error fetching main.breeds json file: ${breedsResponse.status}`;
		return;
	}
	const breeds = await breedsResponse.json();
	console.log(breeds);

	output = `<table>`;

	//  ========== HEADER ==========
	output += `<tr><th>Egg</th><th>Dragons</th></tr>`;

	// ========== DRAGONS ==========
	let hidden = [];
	let dragonsDisplayed = 0;
	for (let d = 0; d < player.dragons.length; ++d) {
		if (player.dragons[d].view.length >= 3 &&
			player.dragons[d].view.length === player.dragons[d].adults &&
			dragonsDisplayed >= 50) {

			hidden.push(player.dragons[d].id);
			continue;
		}

		output += `<tr>`;

		// Show Egg
		output += `<td><a href="${breeds[player.dragons[d].id].encyclopedia}" target="_blank">`;
		for (let i = 0; i < breeds[player.dragons[d].id].name.length; ++i) {
			output += `<img src="${breeds[player.dragons[d].id].img[i]}"`;
			output += `title="${breeds[player.dragons[d].id].name[i]}`;
			output += `\n${breeds[player.dragons[d].id].description}"> `;
		}
		output += `</a></td>`;

		// View https://dragcave.net/image/r5HjG.gif
		output += `<td>`;
		for (let i = 0; i < player.dragons[d].view.length; ++i) {
			output += `<a href="https://dragcave.net/view/${player.dragons[d].view[i]}" target="_blank">`;
			output += `<img src="https://dragcave.net/image/${player.dragons[d].view[i]}.gif">`;
			output += `</a> `;
			++dragonsDisplayed;
		}

		// End
		output += `</td></tr>`;
	}
	output += `</table>`;

	if (hidden.length > 0) output += `\n<h4 title="Breed group hase >= 3 adults">Hidden</h4>`;
	for (let i = 0; i < hidden.length; ++i) {
		output += `<a href="${breeds[hidden[i]].encyclopedia}" target="_blank">`
		for (let j = 0; j < breeds[hidden[i]].name.length; ++j) {
			output += `<img src="${breeds[hidden[i]].img[j]}"`;
			output += `title="${breeds[hidden[i]].name[j]}`;
			output += `\n${breeds[hidden[i]].description}"> `;
		}
		output += `</a>`;
	}

	document.getElementById('output').innerHTML = output;
}

function sortDragons(a, b) {
	if (a.view.length !== b.view.length) return a.view.length - b.view.length;
	if (a.adults !== b.adults) return a.adults - b.adults;
	if (a.date !== b.date) return b.date - a.date;

	return a.id.localeCompare(b.id);
}