async function run() {
	let row1HTML = '';

	const mainJSONResponse = await fetch('main.json');
	if (!mainJSONResponse.ok) {
		throw new Error(`Response status: ${mainJSONResponse.status}`);
		return;
	}

	const mainJSON = await mainJSONResponse.json();
	console.log(mainJSON);

	for (let p = 0; p < mainJSON.players.length; ++p) {
		// console.log(mainJSON.players[i]);

		const playerResponse = await fetch(mainJSON.players[p]);
		if (!playerResponse.ok) {
			throw new Error(`Response status: ${playerResponse.status}`);
			continue;
		}
		const player = await playerResponse.json();
		player.dragons.sort(sortDragons);
		console.log(player);

		let column = `<div class="column"><table>`

		//  ========== HEADER ==========
		column += `<tr><th>${player.name}</th><th>View</th></tr>`;

		// ========== DRAGONS ==========
		let maxDragons = player.dragons.length;

		if (player.dragons.length > 25) {
			let newMax = 0;
			for (let i = 0; player.dragons.length; ++i) {
				if (player.dragons[i].view.length >= 3 && player.dragons[i].adults >= 3) continue;
				++newMax;
			}

			maxDragons = Math.max(newMax, 25);
		}

		for (let d = 0; d < maxDragons; ++d) {
			let row = `<tr>`;

			// Show Eggs
			row += `<td>`
			for (let i = 0; i < mainJSON.breeds[player.dragons[d].id].name.length; ++i) {
				row += `<img src="${mainJSON.breeds[player.dragons[d].id].img[i]}"`;
				row += `title="${mainJSON.breeds[player.dragons[d].id].name[i]}"> `;
			}
			row += `</td>`;

			// View https://dragcave.net/image/r5HjG.gif
			row += `<td>`;
			for (let i = 0; i < player.dragons[d].view.length; ++i) {
				row += `<a href="https://dragcave.net/view/${player.dragons[d].view[i]}" target="_blank">`;
				row += `<img src="https://dragcave.net/image/${player.dragons[d].view[i]}.gif">`;
				row += `</a> `;
			}
			row += `</td>`

			// End
			row += `</tr>`

			column += row;
		}

		column += `</table></div>`;

		row1HTML += column;
	}
	document.getElementById('row1').innerHTML = row1HTML;
}

function sortDragons(a, b) {
	if (a.view.length !== b.view.length) return a.view.length - b.view.length;

	if (a.adults !== b.adults) return a.adults - b.adults;

	return a.id.localeCompare(b.id);
}