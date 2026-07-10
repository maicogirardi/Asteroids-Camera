const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

const scoreValue = document.getElementById("scoreValue");
const hiScoreValue = document.getElementById("hiScoreValue");
const livesValue = document.getElementById("livesValue");
const waveValue = document.getElementById("waveValue");
const menuOverlay = document.getElementById("menuOverlay");
const rankingOverlay = document.getElementById("rankingOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const playerNameInput = document.getElementById("playerName");
const startButton = document.getElementById("startButton");
const menuButton = document.getElementById("menuButton");
const cameraButton = document.getElementById("cameraButton");
const phoneButton = document.getElementById("phoneButton");
const rankingButton = document.getElementById("rankingButton");
const backButton = document.getElementById("backButton");
const restartButton = document.getElementById("restartButton");
const gameOverRankingButton = document.getElementById("gameOverRankingButton");
const rankingList = document.getElementById("rankingList");
const finalScore = document.getElementById("finalScore");
const gameOverTitle = document.getElementById("gameOverTitle");
const cameraDebug = document.getElementById("cameraDebug");
const cameraVideo = document.getElementById("cameraVideo");
const cameraStatus = document.getElementById("cameraStatus");
const cameraVector = document.getElementById("cameraVector");
const cameraGesture = document.getElementById("cameraGesture");
const cameraAcceleration = document.getElementById("cameraAcceleration");
const cameraAccelerationValue = document.getElementById("cameraAccelerationValue");
const phoneSetup = document.getElementById("phoneSetup");
const phoneQr = document.getElementById("phoneQr");
const phoneStatus = document.getElementById("phoneStatus");
const phoneUrl = document.getElementById("phoneUrl");
const phoneVector = document.getElementById("phoneVector");

const storageKey = "asteroids-bb-ranking";
const cameraSettingsStorageKey = "asteroids-camera-settings";
const publicControllerUrl = "https://maicogirardi.github.io/Asteroids-Camera/controller.html";
const palette = {
	space: "#06293a",
	white: "#d8d6e2",
	yellow: "#d6ca31",
	purple: "#8a70c4",
	cyan: "#54c7c4",
	orange: "#ff9740",
	pink: "#ff5a93",
	green: "#22f05e"
};
const asteroidColors = [palette.purple, palette.cyan, palette.orange, palette.pink, palette.cyan];
const world = {
	width: 960,
	height: 640
};

const game = {
	state: "menu",
	score: 0,
	lives: 3,
	wave: 1,
	invulnerableTime: 0,
	fireCooldown: 0,
	lastTime: 0,
	playerName: "Piloto BB"
};

const keys = new Set();
const motionInput = {
	enabled: false,
	source: "none",
	ready: false,
	x: 0,
	y: 0,
	targetX: 0,
	targetY: 0,
	acceleration: 260,
	shooting: false,
	lastVideoTime: -1,
	lastHandRun: 0,
	lastDebugRun: 0,
	handInterval: 125,
	debugInterval: 120,
	handLandmarker: null,
	rightHandDetected: false,
	leftHandDetected: false,
	previewVisible: true,
	cameraEnabledPreference: false,
	preferredSource: "none"
};
const phoneInput = {
	enabled: false,
	connected: false,
	peer: null,
	connection: null,
	roomId: "",
	url: "",
	lastMessageTime: 0,
	latency: 0
};
let ship = createShip();
let bullets = [];
let asteroids = [];
let diamonds = [];
let particles = [];
let stars = [];

function createShip() {
	return {
		x: world.width / 2,
		y: world.height / 2,
		radius: 16,
		angle: -Math.PI / 2,
		velocityX: 0,
		velocityY: 0,
		thrusting: false
	};
}

function resizeCanvas() {
	const rect = canvas.getBoundingClientRect();
	const ratio = window.devicePixelRatio || 1;
	canvas.width = Math.floor(rect.width * ratio);
	canvas.height = Math.floor(rect.height * ratio);
	context.setTransform(canvas.width / world.width, 0, 0, canvas.height / world.height, 0, 0);
	context.imageSmoothingEnabled = false;
	context.lineCap = "square";
	context.lineJoin = "miter";
}

function resetGame() {
	game.state = "playing";
	menuButton.hidden = false;
	game.score = 0;
	game.lives = 3;
	game.wave = 1;
	game.invulnerableTime = 2.2;
	game.fireCooldown = 0;
	game.playerName = (playerNameInput.value || "Piloto BB").trim().slice(0, 16);
	ship = createShip();
	bullets = [];
	diamonds = [];
	particles = [];
	spawnWave();
	updateHud();
	hideAllOverlays();
}

function spawnWave() {
	asteroids = [];
	const count = 4 + game.wave;

	for (let index = 0; index < count; index++) {
		asteroids.push(createAsteroid(randomEdgePosition(), 3));
	}

	for (let index = 0; index < Math.min(2 + game.wave, 7); index++) {
		diamonds.push(createDiamond(randomEdgePosition()));
	}
}

function createAsteroid(position, size) {
	const speed = 28 + Math.random() * 34 + game.wave * 4;
	const angle = Math.random() * Math.PI * 2;
	const radius = size === 3 ? 44 : size === 2 ? 28 : 16;
	const vertices = [];
	const vertexCount = 7 + Math.floor(Math.random() * 3);

	for (let index = 0; index < vertexCount; index++) {
		vertices.push(0.72 + Math.random() * 0.42);
	}

	return {
		x: position.x,
		y: position.y,
		size,
		radius,
		angle: Math.random() * Math.PI * 2,
		spin: (Math.random() - 0.5) * 1.2,
		velocityX: Math.cos(angle) * speed,
		velocityY: Math.sin(angle) * speed,
		color: asteroidColors[Math.floor(Math.random() * asteroidColors.length)],
		vertices
	};
}

function createDiamond(position) {
	const speed = 36 + Math.random() * 42 + game.wave * 5;
	const angle = Math.random() * Math.PI * 2;

	return {
		x: position.x,
		y: position.y,
		radius: 18,
		angle: Math.random() * Math.PI * 2,
		spin: (Math.random() > 0.5 ? 1 : -1) * (1.8 + Math.random()),
		velocityX: Math.cos(angle) * speed,
		velocityY: Math.sin(angle) * speed
	};
}

function randomEdgePosition() {
	const side = Math.floor(Math.random() * 4);
	const margin = 80;

	if (side === 0) {
		return { x: Math.random() * world.width, y: -margin };
	}

	if (side === 1) {
		return { x: world.width + margin, y: Math.random() * world.height };
	}

	if (side === 2) {
		return { x: Math.random() * world.width, y: world.height + margin };
	}

	return { x: -margin, y: Math.random() * world.height };
}

function update(deltaTime) {
	if (game.state !== "playing") {
		return;
	}

	handleInput(deltaTime);
	updateShip(deltaTime);
	updateBullets(deltaTime);
	updateAsteroids(deltaTime);
	updateDiamonds(deltaTime);
	updateParticles(deltaTime);
	checkCollisions();

	game.fireCooldown = Math.max(0, game.fireCooldown - deltaTime);
	game.invulnerableTime = Math.max(0, game.invulnerableTime - deltaTime);

	if (asteroids.length === 0 && diamonds.length === 0) {
		game.wave++;
		game.score += 500;
		game.invulnerableTime = 1.4;
		spawnWave();
		updateHud();
	}
}

function handleInput(deltaTime) {
	const turningLeft = keys.has("ArrowLeft") || keys.has("KeyA");
	const turningRight = keys.has("ArrowRight") || keys.has("KeyD");
	const thrusting = keys.has("ArrowUp") || keys.has("KeyW");
	const braking = keys.has("ArrowDown") || keys.has("KeyS");
	const hasMotion = motionInput.enabled && motionInput.ready;
	const inputSmoothing = Math.min(1, deltaTime * 10);
	motionInput.x += (motionInput.targetX - motionInput.x) * inputSmoothing;
	motionInput.y += (motionInput.targetY - motionInput.y) * inputSmoothing;

	if (turningLeft) {
		ship.angle -= 4.8 * deltaTime;
	}

	if (turningRight) {
		ship.angle += 4.8 * deltaTime;
	}

	ship.thrusting = thrusting;

	if (thrusting) {
		ship.velocityX += Math.cos(ship.angle) * 250 * deltaTime;
		ship.velocityY += Math.sin(ship.angle) * 250 * deltaTime;
	}

	if (braking) {
		ship.velocityX *= 1 - 2.4 * deltaTime;
		ship.velocityY *= 1 - 2.4 * deltaTime;
	}

	if (motionInput.enabled) {
		const cameraDrag = Math.max(0, 1 - 2.2 * deltaTime);
		ship.velocityX *= cameraDrag;
		ship.velocityY *= cameraDrag;
	}

	if (hasMotion) {
		ship.velocityX += motionInput.x * motionInput.acceleration * deltaTime;
		ship.velocityY += motionInput.y * motionInput.acceleration * deltaTime;

		if (Math.abs(motionInput.x) > 0.08 || Math.abs(motionInput.y) > 0.08) {
			ship.angle = Math.atan2(motionInput.y, motionInput.x);
			ship.thrusting = true;
		}
	}

	if ((keys.has("Space") || keys.has("Enter") || motionInput.shooting) && game.fireCooldown <= 0) {
		fireBullet();
	}
}

function updateShip(deltaTime) {
	ship.velocityX *= 0.992;
	ship.velocityY *= 0.992;
	ship.x += ship.velocityX * deltaTime;
	ship.y += ship.velocityY * deltaTime;
	wrapObject(ship);
}

function fireBullet() {
	const noseX = ship.x + Math.cos(ship.angle) * 20;
	const noseY = ship.y + Math.sin(ship.angle) * 20;
	bullets.push({
		x: noseX,
		y: noseY,
		radius: 4,
		life: 1.2,
		velocityX: Math.cos(ship.angle) * 520 + ship.velocityX,
		velocityY: Math.sin(ship.angle) * 520 + ship.velocityY
	});
	game.fireCooldown = 0.16;
}

function updateBullets(deltaTime) {
	bullets = bullets.filter((bullet) => {
		bullet.x += bullet.velocityX * deltaTime;
		bullet.y += bullet.velocityY * deltaTime;
		bullet.life -= deltaTime;
		return bullet.life > 0 && isInsideWorld(bullet);
	});
}

function updateAsteroids(deltaTime) {
	for (const asteroid of asteroids) {
		asteroid.x += asteroid.velocityX * deltaTime;
		asteroid.y += asteroid.velocityY * deltaTime;
		asteroid.angle += asteroid.spin * deltaTime;
		wrapObject(asteroid);
	}
}

function updateDiamonds(deltaTime) {
	for (const diamond of diamonds) {
		diamond.x += diamond.velocityX * deltaTime;
		diamond.y += diamond.velocityY * deltaTime;
		diamond.angle += diamond.spin * deltaTime;
		wrapObject(diamond);
	}
}

function updateParticles(deltaTime) {
	particles = particles.filter((particle) => {
		particle.x += particle.velocityX * deltaTime;
		particle.y += particle.velocityY * deltaTime;
		particle.life -= deltaTime;
		return particle.life > 0;
	});
}

function checkCollisions() {
	for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
		const bullet = bullets[bulletIndex];
		let consumed = false;

		for (let asteroidIndex = asteroids.length - 1; asteroidIndex >= 0; asteroidIndex--) {
			const asteroid = asteroids[asteroidIndex];

			if (!circlesOverlap(bullet, asteroid)) {
				continue;
			}

			bullets.splice(bulletIndex, 1);
			breakAsteroid(asteroidIndex);
			addScore(100);
			consumed = true;
			break;
		}

		if (consumed) {
			continue;
		}

		for (let diamondIndex = diamonds.length - 1; diamondIndex >= 0; diamondIndex--) {
			const diamond = diamonds[diamondIndex];

			if (!circlesOverlap(bullet, diamond)) {
				continue;
			}

			bullets.splice(bulletIndex, 1);
			diamonds.splice(diamondIndex, 1);
			spawnBurst(diamond.x, diamond.y, palette.pink, 18);
			addScore(250);
			break;
		}
	}

	if (game.invulnerableTime > 0) {
		return;
	}

	for (const asteroid of asteroids) {
		if (circlesOverlap(ship, asteroid)) {
			damageShip();
			return;
		}
	}

	for (const diamond of diamonds) {
		if (circlesOverlap(ship, diamond)) {
			damageShip();
			return;
		}
	}
}

function breakAsteroid(index) {
	const asteroid = asteroids[index];
	asteroids.splice(index, 1);
	spawnBurst(asteroid.x, asteroid.y, asteroid.color, 16);

	if (asteroid.size <= 1) {
		return;
	}

	for (let index = 0; index < 2; index++) {
		asteroids.push(createAsteroid({ x: asteroid.x, y: asteroid.y }, asteroid.size - 1));
	}
}

function damageShip() {
	game.lives--;
	spawnBurst(ship.x, ship.y, palette.orange, 26);
	updateHud();

	if (game.lives <= 0) {
		endGame();
		return;
	}

	ship = createShip();
	game.invulnerableTime = 2.4;
}

function endGame() {
	game.state = "gameover";
	menuButton.hidden = true;
	saveScore();
	finalScore.textContent = `Pontuação final: ${game.score}`;
	gameOverTitle.textContent = game.score > 0 ? "Missão encerrada" : "Tente novamente";
	hideAllOverlays();
	gameOverOverlay.classList.remove("hidden");
}

function addScore(value) {
	game.score += value;
	updateHud();
}

function updateHud() {
	scoreValue.textContent = game.score.toString();
	hiScoreValue.textContent = getHighScore().toString();
	livesValue.textContent = game.lives.toString();
	waveValue.textContent = game.wave.toString();
}

function draw() {
	clearCanvas();
	drawStarfield();
	drawDiamonds();
	drawAsteroids();
	drawBullets();
	drawShip();
	drawParticles();

	if (game.state === "paused") {
		drawPause();
	}
}

function clearCanvas() {
	context.fillStyle = palette.space;
	context.fillRect(0, 0, world.width, world.height);
}

function drawStarfield() {
	context.save();

	for (const star of stars) {
		context.globalAlpha = star.alpha;
		context.fillStyle = star.color;
		context.fillRect(star.x, star.y, star.size, star.size);
	}

	context.restore();
}

function drawShip() {
	if (game.state === "menu") {
		return;
	}

	if (game.invulnerableTime > 0 && Math.floor(game.invulnerableTime * 10) % 2 === 0) {
		return;
	}

	context.save();
	context.translate(Math.round(ship.x), Math.round(ship.y));
	context.rotate(ship.angle);
	context.strokeStyle = palette.green;
	context.fillStyle = palette.green;
	context.lineWidth = 4;
	context.beginPath();
	context.moveTo(24, 0);
	context.lineTo(-16, -16);
	context.lineTo(-9, 0);
	context.lineTo(-16, 16);
	context.closePath();
	context.fill();
	context.stroke();

	if (ship.thrusting) {
		context.strokeStyle = palette.orange;
		context.lineWidth = 4;
		context.beginPath();
		context.moveTo(-18, -8);
		context.lineTo(-34, 0);
		context.lineTo(-18, 8);
		context.stroke();
	}

	context.restore();
}

function drawBullets() {
	context.fillStyle = palette.yellow;

	for (const bullet of bullets) {
		context.fillRect(Math.round(bullet.x - 3), Math.round(bullet.y - 3), 6, 6);
	}
}

function drawAsteroids() {
	context.save();
	context.lineWidth = 4;

	for (const asteroid of asteroids) {
		context.save();
		context.translate(Math.round(asteroid.x), Math.round(asteroid.y));
		context.rotate(asteroid.angle);
		context.strokeStyle = asteroid.color;
		context.beginPath();

		for (let index = 0; index < asteroid.vertices.length; index++) {
			const angle = (index / asteroid.vertices.length) * Math.PI * 2;
			const radius = asteroid.radius * asteroid.vertices[index];
			const x = Math.round(Math.cos(angle) * radius / 4) * 4;
			const y = Math.round(Math.sin(angle) * radius / 4) * 4;

			if (index === 0) {
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
		}

		context.closePath();
		context.stroke();
		context.restore();
	}

	context.restore();
}

function drawDiamonds() {
	for (const diamond of diamonds) {
		context.save();
		context.translate(Math.round(diamond.x), Math.round(diamond.y));
		context.rotate(diamond.angle);
		context.strokeStyle = palette.pink;
		context.fillStyle = palette.pink;
		context.lineWidth = 4;
		context.beginPath();
		context.moveTo(0, -24);
		context.lineTo(20, 0);
		context.lineTo(0, 24);
		context.lineTo(-20, 0);
		context.closePath();
		context.fill();
		context.stroke();
		context.beginPath();
		context.moveTo(-18, 0);
		context.lineTo(0, -22);
		context.lineTo(18, 0);
		context.moveTo(-18, 0);
		context.lineTo(0, 22);
		context.lineTo(18, 0);
		context.stroke();
		context.restore();
	}
}

function drawParticles() {
	context.save();

	for (const particle of particles) {
		context.globalAlpha = Math.max(0, particle.life);
		context.fillStyle = particle.color;
		context.fillRect(Math.round(particle.x), Math.round(particle.y), 4, 4);
	}

	context.restore();
}

function drawPause() {
	context.save();
	context.fillStyle = "rgba(4, 26, 40, 0.82)";
	context.fillRect(0, 0, world.width, world.height);
	context.fillStyle = palette.yellow;
	context.font = "900 48px 'Courier New', monospace";
	context.textAlign = "center";
	context.fillText("PAUSADO", world.width / 2, world.height / 2);
	context.restore();
}

function spawnBurst(x, y, color, count) {
	for (let index = 0; index < count; index++) {
		const angle = Math.random() * Math.PI * 2;
		const speed = 60 + Math.random() * 170;
		particles.push({
			x,
			y,
			color,
			life: 0.35 + Math.random() * 0.6,
			velocityX: Math.cos(angle) * speed,
			velocityY: Math.sin(angle) * speed
		});
	}
}

function circlesOverlap(first, second) {
	const deltaX = first.x - second.x;
	const deltaY = first.y - second.y;
	const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	return distance < first.radius + second.radius;
}

function wrapObject(object) {
	if (object.x < -object.radius) {
		object.x = world.width + object.radius;
	} else if (object.x > world.width + object.radius) {
		object.x = -object.radius;
	}

	if (object.y < -object.radius) {
		object.y = world.height + object.radius;
	} else if (object.y > world.height + object.radius) {
		object.y = -object.radius;
	}
}

function isInsideWorld(object) {
	return object.x >= -object.radius &&
		object.x <= world.width + object.radius &&
		object.y >= -object.radius &&
		object.y <= world.height + object.radius;
}

function saveScore() {
	const ranking = readRanking();
	ranking.push({
		name: game.playerName || "Piloto BB",
		score: game.score,
		date: new Date().toLocaleDateString("pt-BR")
	});
	ranking.sort((a, b) => b.score - a.score);
	localStorage.setItem(storageKey, JSON.stringify(ranking.slice(0, 10)));
}

function readRanking() {
	try {
		return JSON.parse(localStorage.getItem(storageKey)) || [];
	} catch {
		return [];
	}
}

function getHighScore() {
	const ranking = readRanking();

	if (ranking.length === 0) {
		return game.score;
	}

	return Math.max(game.score, ranking[0].score || 0);
}

function renderRanking() {
	const ranking = readRanking();
	rankingList.innerHTML = "";

	if (ranking.length === 0) {
		const empty = document.createElement("li");
		empty.className = "empty";
		empty.textContent = "Nenhuma pontuação registrada ainda.";
		rankingList.appendChild(empty);
		return;
	}

	for (const entry of ranking) {
		const item = document.createElement("li");
		item.textContent = `${entry.name} - ${entry.score} pts - ${entry.date}`;
		rankingList.appendChild(item);
	}
}

function showRanking() {
	menuButton.hidden = true;
	renderRanking();
	hideAllOverlays();
	rankingOverlay.classList.remove("hidden");
	game.state = game.state === "playing" ? "paused" : game.state;
}

function showMenu() {
	game.state = "menu";
	menuButton.hidden = true;
	hideAllOverlays();
	menuOverlay.classList.remove("hidden");
}

function hideAllOverlays() {
	menuOverlay.classList.add("hidden");
	rankingOverlay.classList.add("hidden");
	gameOverOverlay.classList.add("hidden");
}

function createStars() {
	stars = [];

	for (let index = 0; index < 86; index++) {
		stars.push({
			x: Math.round(Math.random() * world.width / 4) * 4,
			y: Math.round(Math.random() * world.height / 4) * 4,
			size: Math.random() > 0.84 ? 4 : 2,
			alpha: 0.2 + Math.random() * 0.52,
			color: Math.random() > 0.78 ? palette.cyan : palette.white
		});
	}
}

function loop(timestamp) {
	const deltaTime = Math.min(0.033, (timestamp - game.lastTime) / 1000 || 0);
	game.lastTime = timestamp;
	update(deltaTime);
	draw();
	requestAnimationFrame(loop);
}

function loadCameraSettings() {
	try {
		const settings = JSON.parse(localStorage.getItem(cameraSettingsStorageKey));

		if (settings) {
			const acceleration = Number(settings.acceleration);

			if (Number.isFinite(acceleration)) {
				motionInput.acceleration = Math.max(250, Math.min(1500, acceleration));
			}

			motionInput.previewVisible = settings.previewVisible !== false;
			motionInput.cameraEnabledPreference = settings.cameraEnabled === true;
			motionInput.preferredSource = settings.preferredSource === "phone" || settings.preferredSource === "camera"
				? settings.preferredSource
				: "none";
		}
	} catch {
		localStorage.removeItem(cameraSettingsStorageKey);
	}

	cameraAcceleration.value = String(motionInput.acceleration);
	cameraAccelerationValue.value = String(motionInput.acceleration);
}

function saveCameraSettings() {
	localStorage.setItem(cameraSettingsStorageKey, JSON.stringify({
		acceleration: motionInput.acceleration,
		cameraEnabled: motionInput.cameraEnabledPreference,
		previewVisible: motionInput.previewVisible,
		preferredSource: motionInput.preferredSource
	}));
}

async function enableCameraControls(isRestore = false) {
	if (motionInput.source === "camera") {
		return;
	}

	disablePhoneControls(false);

	const mediaPipeVersion = "0.10.21";
	cameraButton.disabled = true;
	cameraButton.textContent = "Carregando...";
	cameraDebug.classList.remove("hidden");
	cameraStatus.textContent = "Solicitando câmera...";

	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				width: { ideal: 256 },
				height: { ideal: 144 },
				frameRate: { ideal: 15, max: 15 },
				facingMode: "user"
			},
			audio: false
		});

		cameraVideo.srcObject = stream;
		await cameraVideo.play();
		cameraStatus.textContent = "Carregando modelos...";

		const vision = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${mediaPipeVersion}/vision_bundle.mjs`);
		const filesetResolver = await vision.FilesetResolver.forVisionTasks(
			`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${mediaPipeVersion}/wasm`
		);

		motionInput.handLandmarker = await vision.HandLandmarker.createFromOptions(filesetResolver, {
			baseOptions: {
				modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
				delegate: "GPU"
			},
			runningMode: "VIDEO",
			numHands: 2,
			minHandDetectionConfidence: 0.45,
			minHandPresenceConfidence: 0.45,
			minTrackingConfidence: 0.45
		});

		motionInput.enabled = true;
		motionInput.source = "camera";
		motionInput.cameraEnabledPreference = true;
		motionInput.preferredSource = "camera";
		cameraDebug.classList.toggle("hidden", !motionInput.previewVisible);
		cameraButton.disabled = false;
		cameraButton.textContent = motionInput.previewVisible ? "Ocultar câmera" : "Mostrar câmera";
		cameraStatus.textContent = "Mostre as mãos para a câmera";
		saveCameraSettings();
		requestAnimationFrame(updateCameraInput);
	} catch (error) {
		console.error(error);
		motionInput.enabled = false;

		if (!isRestore) {
			motionInput.cameraEnabledPreference = false;
			saveCameraSettings();
		}

		cameraButton.disabled = false;
		cameraButton.textContent = "Ativar câmera";
		cameraStatus.textContent = getCameraErrorMessage(error);
	}
}

function disableCameraControls(savePreference = true) {
	if (cameraVideo.srcObject) {
		for (const track of cameraVideo.srcObject.getTracks()) {
			track.stop();
		}
	}

	cameraVideo.srcObject = null;
	motionInput.enabled = false;
	motionInput.ready = false;
	motionInput.source = "none";
	motionInput.targetX = 0;
	motionInput.targetY = 0;
	motionInput.shooting = false;
	motionInput.rightHandDetected = false;
	motionInput.leftHandDetected = false;
	motionInput.cameraEnabledPreference = false;
	cameraDebug.classList.add("hidden");
	cameraButton.disabled = false;
	cameraButton.textContent = "Ativar câmera";
	cameraStatus.textContent = "Câmera desligada";
	cameraVector.textContent = "X 0.00 | Y 0.00";
	cameraGesture.textContent = "Gesto: nenhum";

	if (savePreference) {
		motionInput.preferredSource = "none";
		saveCameraSettings();
	}
}

function toggleCameraControls() {
	if (motionInput.source !== "camera") {
		enableCameraControls();
		return;
	}

	motionInput.previewVisible = !motionInput.previewVisible;
	cameraDebug.classList.toggle("hidden", !motionInput.previewVisible);
	cameraButton.textContent = motionInput.previewVisible ? "Ocultar câmera" : "Mostrar câmera";
	saveCameraSettings();
}

function getCameraErrorMessage(error) {
	if (error.name === "NotAllowedError") {
		return "Permissão da câmera negada";
	}

	if (error.name === "NotFoundError") {
		return "Nenhuma câmera encontrada";
	}

	if (error.name === "NotReadableError") {
		return "Câmera em uso por outro app";
	}

	return `Erro: ${error.name || "câmera"}`;
}

function updateCameraInput() {
	if (motionInput.source !== "camera") {
		return;
	}

	if (!motionInput.enabled || cameraVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
		requestAnimationFrame(updateCameraInput);
		return;
	}

	const timestamp = performance.now();

	if (cameraVideo.currentTime !== motionInput.lastVideoTime) {
		motionInput.lastVideoTime = cameraVideo.currentTime;

		if (timestamp - motionInput.lastHandRun >= motionInput.handInterval) {
			motionInput.lastHandRun = timestamp;
			updateHandInput(timestamp);
		}

		if (timestamp - motionInput.lastDebugRun >= motionInput.debugInterval) {
			motionInput.lastDebugRun = timestamp;
			updateCameraDebug();
		}
	}

	requestAnimationFrame(updateCameraInput);
}

function updateHandInput(timestamp) {
	const results = motionInput.handLandmarker.detectForVideo(cameraVideo, timestamp);
	motionInput.rightHandDetected = false;
	motionInput.leftHandDetected = false;
	motionInput.shooting = false;

	for (let index = 0; index < (results.landmarks?.length || 0); index++) {
		const landmarks = results.landmarks[index];
		const handedness = results.handednesses[index]?.[0]?.categoryName;

		if (handedness === "Right") {
			updateRightHandMovement(landmarks);
			motionInput.rightHandDetected = true;
		} else if (handedness === "Left") {
			motionInput.leftHandDetected = true;
			motionInput.shooting = isHandClosed(landmarks);
		}
	}

	if (!motionInput.rightHandDetected) {
		motionInput.targetX = 0;
		motionInput.targetY = 0;
	}

	motionInput.ready = motionInput.rightHandDetected;
	cameraStatus.textContent = getHandStatus();
}

function updateRightHandMovement(landmarks) {
	const palmIndices = [0, 5, 9, 13, 17];
	const palm = palmIndices.reduce((position, index) => {
		position.x += landmarks[index].x;
		position.y += landmarks[index].y;
		return position;
	}, { x: 0, y: 0 });

	palm.x /= palmIndices.length;
	palm.y /= palmIndices.length;

	const deadzone = 0.12;
	const sensitivity = 2.8;
	const mirroredX = 1 - palm.x;
	motionInput.targetX = applyDeadzone((mirroredX - 0.5) * sensitivity, deadzone);
	motionInput.targetY = applyDeadzone((palm.y - 0.5) * sensitivity, deadzone);
}

function isHandClosed(landmarks) {
	const wrist = landmarks[0];
	const fingers = [
		{ tip: 8, joint: 6 },
		{ tip: 12, joint: 10 },
		{ tip: 16, joint: 14 },
		{ tip: 20, joint: 18 }
	];
	let closedFingers = 0;

	for (const finger of fingers) {
		const tipDistance = getLandmarkDistance(landmarks[finger.tip], wrist);
		const jointDistance = getLandmarkDistance(landmarks[finger.joint], wrist);

		if (tipDistance < jointDistance * 1.18) {
			closedFingers++;
		}
	}

	return closedFingers >= 3;
}

function getLandmarkDistance(first, second) {
	return Math.hypot(first.x - second.x, first.y - second.y);
}

function getHandStatus() {
	if (motionInput.rightHandDetected && motionInput.leftHandDetected) {
		return "Duas mãos detectadas";
	}

	if (motionInput.rightHandDetected) {
		return "Mão direita controlando";
	}

	if (motionInput.leftHandDetected) {
		return "Mostre também a mão direita";
	}

	return "Nenhuma mão detectada";
}

function applyDeadzone(value, deadzone) {
	if (Math.abs(value) < deadzone) {
		return 0;
	}

	return Math.max(-1, Math.min(1, value));
}

function updateCameraDebug() {
	cameraVector.textContent = `X ${motionInput.x.toFixed(2)} | Y ${motionInput.y.toFixed(2)}`;
	cameraGesture.textContent = motionInput.shooting ? "Esquerda: fechada (tiro)" : "Esquerda: aberta";
}

function togglePhoneControls() {
	if (phoneInput.enabled) {
		disablePhoneControls();
		return;
	}

	enablePhoneControls();
}

function enablePhoneControls() {
	disableCameraControls(false);

	if (typeof Peer === "undefined") {
		phoneStatus.textContent = "PeerJS não carregou";
		phoneSetup.classList.remove("hidden");
		return;
	}

	disablePhoneControls(false);
	phoneInput.enabled = true;
	phoneInput.connected = false;
	phoneInput.roomId = `asteroids-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
	phoneInput.url = getPhoneControllerUrl(phoneInput.roomId);
	motionInput.enabled = true;
	motionInput.ready = false;
	motionInput.source = "phone";
	motionInput.preferredSource = "phone";
	motionInput.cameraEnabledPreference = false;
	phoneSetup.classList.remove("hidden");
	phoneButton.textContent = "Desligar celular";
	phoneStatus.textContent = "Criando sala...";
	phoneUrl.textContent = phoneInput.url;
	phoneVector.textContent = "X 0.00 | Y 0.00 | 0 ms";
	saveCameraSettings();
	drawPhoneQr();

	phoneInput.peer = new Peer(phoneInput.roomId, {
		debug: 0
	});

	phoneInput.peer.on("open", () => {
		phoneStatus.textContent = "Escaneie o QR Code";
	});

	phoneInput.peer.on("connection", (connection) => {
		if (phoneInput.connection && phoneInput.connection.open) {
			phoneInput.connection.close();
		}

		phoneInput.connection = connection;
		bindPhoneConnection(connection);
	});

	phoneInput.peer.on("error", (error) => {
		console.error(error);
		phoneStatus.textContent = `Erro: ${error.type || "conexão"}`;
	});
}

function disablePhoneControls(savePreference = true) {
	if (phoneInput.connection) {
		phoneInput.connection.close();
	}

	if (phoneInput.peer) {
		phoneInput.peer.destroy();
	}

	phoneInput.enabled = false;
	phoneInput.connected = false;
	phoneInput.peer = null;
	phoneInput.connection = null;
	phoneInput.roomId = "";
	phoneInput.url = "";
	phoneInput.lastMessageTime = 0;
	phoneInput.latency = 0;
	phoneSetup.classList.add("hidden");
	phoneButton.textContent = "Controle por celular";
	phoneStatus.textContent = "Celular desligado";
	phoneUrl.textContent = "Aguardando sala...";
	phoneVector.textContent = "X 0.00 | Y 0.00 | 0 ms";

	if (motionInput.source === "phone") {
		motionInput.enabled = false;
		motionInput.ready = false;
		motionInput.source = "none";
		motionInput.targetX = 0;
		motionInput.targetY = 0;
		motionInput.shooting = false;
	}

	if (savePreference) {
		motionInput.preferredSource = "none";
		saveCameraSettings();
	}
}

function bindPhoneConnection(connection) {
	phoneStatus.textContent = "Celular conectando...";

	connection.on("open", () => {
		phoneInput.connected = true;
		motionInput.ready = true;
		phoneStatus.textContent = "Celular conectado";
	});

	connection.on("data", (data) => {
		updatePhoneInput(data);
	});

	connection.on("close", () => {
		phoneInput.connected = false;
		motionInput.ready = false;
		motionInput.targetX = 0;
		motionInput.targetY = 0;
		motionInput.shooting = false;
		phoneStatus.textContent = "Celular desconectado";
	});

	connection.on("error", (error) => {
		console.error(error);
		phoneStatus.textContent = "Erro no celular";
	});
}

function updatePhoneInput(data) {
	if (motionInput.source !== "phone" || !data || data.type !== "motion") {
		return;
	}

	const timestamp = performance.now();
	const x = Number(data.x);
	const y = Number(data.y);
	const packetInterval = phoneInput.lastMessageTime > 0 ? Math.round(timestamp - phoneInput.lastMessageTime) : 0;

	motionInput.targetX = Number.isFinite(x) ? applyDeadzone(x, 0.08) : 0;
	motionInput.targetY = Number.isFinite(y) ? applyDeadzone(y, 0.08) : 0;
	motionInput.shooting = data.shooting === true;
	motionInput.ready = true;
	phoneInput.connected = true;
	phoneInput.lastMessageTime = timestamp;
	phoneInput.latency = packetInterval;
	phoneStatus.textContent = motionInput.shooting ? "Celular conectado: tiro" : "Celular conectado";
	phoneVector.textContent = `X ${motionInput.targetX.toFixed(2)} | Y ${motionInput.targetY.toFixed(2)} | ${phoneInput.latency} ms`;
}

function drawPhoneQr() {
	phoneQr.replaceChildren();

	if (typeof QRCode === "undefined") {
		phoneQr.textContent = "QR indisponível";
		return;
	}

	new QRCode(phoneQr, {
		text: phoneInput.url,
		width: 164,
		height: 164,
		colorDark: "#06112f",
		colorLight: "#ffffff",
		correctLevel: QRCode.CorrectLevel.M
	});
}

function getPhoneControllerUrl(roomId) {
	const url = new URL("controller.html", window.location.href);
	const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";

	if (isLocalhost) {
		url.href = publicControllerUrl;
	}

	url.searchParams.set("room", roomId);
	return url.href;
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("keydown", (event) => {
	if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
		event.preventDefault();
	}

	if (event.code === "KeyP" && (game.state === "playing" || game.state === "paused")) {
		game.state = game.state === "playing" ? "paused" : "playing";
		hideAllOverlays();
		return;
	}

	keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
	keys.delete(event.code);
});

playerNameInput.addEventListener("focus", () => {
	playerNameInput.select();
});

playerNameInput.addEventListener("pointerup", (event) => {
	event.preventDefault();
	playerNameInput.select();
});

startButton.addEventListener("click", resetGame);
menuButton.addEventListener("click", showMenu);
cameraButton.addEventListener("click", toggleCameraControls);
phoneButton.addEventListener("click", togglePhoneControls);
restartButton.addEventListener("click", resetGame);
rankingButton.addEventListener("click", showRanking);
gameOverRankingButton.addEventListener("click", showRanking);
backButton.addEventListener("click", showMenu);

cameraAcceleration.addEventListener("input", () => {
	motionInput.acceleration = Number(cameraAcceleration.value);
	cameraAccelerationValue.value = cameraAcceleration.value;
	saveCameraSettings();
});

loadCameraSettings();

if (motionInput.preferredSource === "phone") {
	enablePhoneControls();
} else if (motionInput.cameraEnabledPreference) {
	enableCameraControls(true);
}

createStars();
resizeCanvas();
updateHud();
requestAnimationFrame(loop);
