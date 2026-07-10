const connectionStatus = document.getElementById("connectionStatus");
const motionStatus = document.getElementById("motionStatus");
const motionVector = document.getElementById("motionVector");
const motionButton = document.getElementById("motionButton");
const calibrateButton = document.getElementById("calibrateButton");
const fireButton = document.getElementById("fireButton");

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");
const state = {
	peer: null,
	connection: null,
	motionEnabled: false,
	shooting: false,
	beta: 0,
	gamma: 0,
	motionBeta: 0,
	motionGamma: 0,
	baseBeta: 0,
	baseGamma: 0,
	x: 0,
	y: 0,
	needsCalibration: true,
	hasSensorReading: false,
	sensorWatchdog: 0,
	sendTimer: 0
};

function connect() {
	if (!roomId) {
		connectionStatus.textContent = "Sala não informada";
		return;
	}

	if (typeof Peer === "undefined") {
		connectionStatus.textContent = "PeerJS não carregou";
		return;
	}

	state.peer = new Peer(undefined, {
		debug: 0
	});

	state.peer.on("open", () => {
		connectionStatus.textContent = "Entrando na sala...";
		state.connection = state.peer.connect(roomId, {
			reliable: false
		});
		bindConnection();
	});

	state.peer.on("error", (error) => {
		console.error(error);
		connectionStatus.textContent = `Erro: ${error.type || "conexão"}`;
	});
}

function bindConnection() {
	state.connection.on("open", () => {
		connectionStatus.textContent = "Conectado";
		sendInput();
	});

	state.connection.on("close", () => {
		connectionStatus.textContent = "Desconectado";
	});

	state.connection.on("error", (error) => {
		console.error(error);
		connectionStatus.textContent = "Erro na conexão";
	});
}

async function enableMotion() {
	try {
		const orientationAllowed = await requestSensorPermission(window.DeviceOrientationEvent);
		const motionAllowed = await requestSensorPermission(window.DeviceMotionEvent);

		if (!orientationAllowed && !motionAllowed) {
			motionStatus.textContent = "Permissão negada";
			return;
		}

		window.addEventListener("deviceorientation", handleOrientation, true);
		window.addEventListener("devicemotion", handleDeviceMotion, true);
		state.motionEnabled = true;
		state.needsCalibration = true;
		state.hasSensorReading = false;
		motionButton.textContent = "Giroscópio ativo";
		motionStatus.textContent = "Mantenha parado para calibrar";
		startSending();
		startSensorWatchdog();
	} catch (error) {
		console.error(error);
		motionStatus.textContent = "Erro ao ativar giroscópio";
	}
}

async function requestSensorPermission(sensorEvent) {
	if (typeof sensorEvent === "undefined") {
		return false;
	}

	if (typeof sensorEvent.requestPermission !== "function") {
		return true;
	}

	return await sensorEvent.requestPermission() === "granted";
}

function handleOrientation(event) {
	const beta = Number(event.beta);
	const gamma = Number(event.gamma);

	if (!Number.isFinite(beta) || !Number.isFinite(gamma)) {
		return;
	}

	state.beta = beta;
	state.gamma = gamma;
	state.hasSensorReading = true;
	updateVector();
}

function handleDeviceMotion(event) {
	const gravity = event.accelerationIncludingGravity;

	if (!gravity) {
		return;
	}

	const x = Number(gravity.x);
	const y = Number(gravity.y);

	if (!Number.isFinite(x) || !Number.isFinite(y)) {
		return;
	}

	state.motionGamma = x * 9;
	state.motionBeta = y * -9;

	if (!state.hasSensorReading) {
		state.beta = state.motionBeta;
		state.gamma = state.motionGamma;
	}

	state.hasSensorReading = true;
	updateVector();
}

function startSensorWatchdog() {
	window.clearTimeout(state.sensorWatchdog);
	state.sensorWatchdog = window.setTimeout(() => {
		if (!state.hasSensorReading) {
			motionStatus.textContent = "Sensor bloqueado: abra via HTTPS";
		}
	}, 1800);
}

function updateVector() {
	if (state.needsCalibration) {
		calibrate();
		state.needsCalibration = false;
		motionStatus.textContent = "Incline o celular";
	}

	const rawX = (state.gamma - state.baseGamma) / 24;
	const rawY = (state.beta - state.baseBeta) / 24;
	state.x = clamp(applyDeadzone(rawX, 0.08), -1, 1);
	state.y = clamp(applyDeadzone(rawY, 0.08), -1, 1);
	motionVector.textContent = `X ${state.x.toFixed(2)} | Y ${state.y.toFixed(2)}`;
}

function calibrate() {
	state.baseBeta = state.beta;
	state.baseGamma = state.gamma;
	state.needsCalibration = false;
	updateVector();
}

function startSending() {
	if (state.sendTimer) {
		return;
	}

	state.sendTimer = window.setInterval(sendInput, 33);
}

function sendInput() {
	if (!state.connection || !state.connection.open) {
		return;
	}

	state.connection.send({
		type: "motion",
		x: state.motionEnabled ? state.x : 0,
		y: state.motionEnabled ? state.y : 0,
		shooting: state.shooting
	});
}

function applyDeadzone(value, deadzone) {
	if (Math.abs(value) < deadzone) {
		return 0;
	}

	return value;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function setShooting(isShooting) {
	state.shooting = isShooting;
	sendInput();
}

motionButton.addEventListener("click", enableMotion);
calibrateButton.addEventListener("click", calibrate);

fireButton.addEventListener("pointerdown", (event) => {
	event.preventDefault();
	setShooting(true);
});

window.addEventListener("pointerup", () => setShooting(false));
window.addEventListener("pointercancel", () => setShooting(false));
window.addEventListener("blur", () => setShooting(false));

document.addEventListener("touchmove", (event) => {
	event.preventDefault();
}, { passive: false });

connect();
