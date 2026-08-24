const lastReloaded = Date.now();
const lastReloadedStr = new Date(lastReloaded);

async function run() {
	try {
		await checkRateLimit();

		if (rateLimit.rate.remaining <= 0) {
			const waitDate = rateLimitReset + (1 * 60 * 1000);

			console.log('Rate limit reached zero');
			let output = 'Rate limit reached zero.<br>';
			output += `Waiting until ${new Date(waitDate)}.`;

			document.getElementById('output').innerHTML = output;
			clearInterval(update);
			await sleep(waitDate - Date.now());
			customReload();
		}

		await Promise.all([draw(), quickLinks()]);

		jsonLastPushed = jsonLastCommit;
	} catch (err) {
		console.trace();
		console.error(err);
		document.getElementById('output').innerHTML = `<p>${err}<br>Reloading in 5 seconds</p>`;
		await sleep(5 * 1000);
		if (document.getElementById('pauseReload')?.checked) return;
		customReload();
	}
}

window.matchMedia("(orientation: portrait)").addEventListener("change", async e => {
	await orientationChange();
});

let jsonLastPushed = 0;
let lastChecked = lastReloaded;
const update = setInterval(async () => {
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

		let output = `Rate Limit Remaining: ${rateLimit.rate.remaining} of ${rateLimit.rate.limit}`;
		output += `<br>Rate Limit Reset On: ${new Date(rateLimitReset)}`;

		document.getElementById('rateLimit').innerHTML = output;
	} catch (err) {
		console.trace();
		console.error(err);
		document.getElementById('output').innerHTML = `<p>${err}<br>Reloading in 5 seconds</p>`;
		await sleep(5 * 1000);
		if (document.getElementById('pauseReload')?.checked) return;
		customReload();
	}
}, 0.5 * 1000);