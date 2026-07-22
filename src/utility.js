window.onbeforeunload = function (event) {
	sessionStorage.setItem('scrollY', window.scrollY);
	sessionStorage.setItem('lastUnfinish_shown', lastUnfinish_shown);
}

function customReload() {
	sessionStorage.setItem('scrollY', window.scrollY);
	sessionStorage.setItem('lastUnfinish_shown', lastUnfinish_shown);

	console.trace();
	const dateNow = Date.now();
	console.log(dateNow, lastReloaded, dateNow - lastReloaded < 1 * 60 * 1000);
	if (dateNow - lastReloaded < 1 * 60 * 1000) return;

	clearInterval(reloadInterval);
	location.reload();
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function customImgElement(src = ' ', alt = ' ', title = ' ') {
	if (src === ' ') return '';

	if (title === ' ') return `<img src="${src}" ${alt === ' ' ? '' : `alt="${alt}"`}>`;

	return `<span class="tooltip" data-title="${title}">
		<img src="${src}" ${alt === ' ' ? '' : `alt="${alt}"`}>
	</span>`;
}

document.addEventListener("pointerover", e => {
	const element = e.target.closest(".tooltip");

	if (!element || element._tooltip || element.contains(e.relatedTarget)) return;

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