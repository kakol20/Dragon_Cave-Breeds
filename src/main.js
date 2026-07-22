async function run() {
	try {
		await draw();
	} catch(err) {
		document.getElementById('output').innerHTML = `${err}<br>Reloading in 5 seconds`;
		await sleep(5 * 1000);
		location.reload();
	}
}

window.matchMedia("(orientation: portrait)").addEventListener("change", async e => {
	await orientationChange();
});