const lastReloaded = Date.now();
const lastReloadedStr = new Date(lastReloaded);

async function run() {
	try {
		await draw();
		jsonLastPushed = jsonLastCommit;
	} catch (err) {
		console.trace();
		document.getElementById('output').innerHTML = `${err}<br>Reloading in 5 seconds`;
		await sleep(5 * 1000);
		location.reload();
	}
}

window.matchMedia("(orientation: portrait)").addEventListener("change", async e => {
	await orientationChange();
});

let jsonLastPushed = 0;
let lastChecked = lastReloaded;
const reloadInterval = setInterval(async () => {
	const reloadInterval = 10;
	try {
		if (document.getElementById('pauseReload')?.checked) return;

		const dateNow = Date.now();

		if (dateNow - lastChecked < 1 * 60 * 1000) return;
		if (dateNow - lastReloaded < (reloadInterval / 2) * 60 * 1000) return;
		// console.log(dateNow, lastReloaded, dateNow - lastReloaded < 5 * 60 * 1000);

		const dateStr = new Date(dateNow);
		const dateMinutes = dateStr.getMinutes();
		// console.log(dateStr.getMinutes());

		if (dateMinutes % reloadInterval !== 0) return;
		if (dateStr.getSeconds() !== 0) return;
		console.log('Check', dateStr);
		lastChecked = dateNow;

		await getJsonRepo(false, false);
		const pushed_at = jsonLastCommit;

		if (jsonLastPushed !== pushed_at) {
			sessionStorage.setItem('jsonRepo', JSON.stringify(jsonRepo));
			customReload();
		}

		if (dateMinutes % (reloadInterval * 3) === 0 && dateNow - lastReloaded >= reloadInterval * 60 * 1000) customReload();
		if (dateNow - lastReloaded >= reloadInterval * 3 * 60 * 1000) customReload();

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