const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const port = new SerialPort('/dev/tty.wchusbserial1430', { baudRate: 9600 })

const express = require('express')
const app = express()
const httpPort = 3000

const MSG_HEAD = 'ypr'
const DELIMITER = '~'
const CALIBRATION_SIZE = 800
const RANGE_LIMIT = 20

let orientation = ""

let lastMessage = Date.now();

const parser = new Readline()
port.pipe(parser)

const ear = (() => {

	const initData = []
	const calibData = {y: 0, p: 0, r: 0}
	let faceAngle = 0;
	let faceAngle_plus90 = 90;
	let faceAngle_minus90 = -90;
	let logDataNow = true


	const angleFix = (deg) => {
		if(deg < -180) {
			deg = deg + 360;
		}

		if(deg > 180) {
			deg = deg - 360;
		}

		return deg;
	}

	const inRange = (deg, comparison) => {
		const upperLimit = angleFix(comparison + RANGE_LIMIT);
		const lowerLimit = angleFix(comparison - RANGE_LIMIT);

		if(angleFix(deg - lowerLimit) > 0 && angleFix(deg - upperLimit) < 0) {
			return true;
		}	else {
			return false;
		}
	}

	const logData = (dat) => {
		console.log(dat.y)
		initData.push(dat)
		if(initData.length > CALIBRATION_SIZE) {
			console.log("Saved for calibration");
			logDataNow = false

			console.log("calibrated");

			calibData.y = dat.y;
			calibData.p = dat.p;
			calibData.r = dat.r;

			faceAngle = calibData.y;
			faceAngle_plus90 = angleFix(faceAngle + 90);
			faceAngle_minus90 = angleFix(faceAngle - 90);

		}
	}

	const resolveData = (dat) => {
		console.log(dat.y)
		if(inRange(dat.y, faceAngle)) {
			console.log("front");
			orientation = "front";
		}

		if(inRange(dat.y, faceAngle_plus90)) {
			if(inRange(dat.r, 0)) {
				console.log("right up");
				orientation = "right";
			}

			if(inRange(dat.r, 180)) {
				console.log("left up");
				orientation = "left";
			}
		}

		if(inRange(dat.y, faceAngle_minus90)) {
			if(inRange(dat.r, 0)) {
				console.log("left down");
				orientation = "left";
			}

			if(inRange(dat.r, 180)) {
				console.log("right down");
				orientation = "right";
			}
		}

	}

	const tell = (str) => {
		lastMessage = Date.now();
		if(typeof str == 'string' && str.indexOf(MSG_HEAD) > -1) {
			const msg = str.split(DELIMITER);
			const data = {
				"y": parseFloat(msg[1]),
				"p": parseFloat(msg[2]),
				"r": parseFloat(msg[3])
			}

			if(logDataNow) {
				logData(data)
			}	else {
				resolveData(data);
			}
		}
	}

	return {tell}

})()

setInterval(() => {
	if(Date.now() - lastMessage > 2000) {
		console.log("send character");
		port.write('r');
	}
}, 2000)

parser.on('data', line => ear.tell(line))
port.write('ROBOT POWER ON\n')

app.get('/', (req, res) => res.send(orientation))

app.listen(httpPort, () => console.log(`Example app listening on port ${httpPort}!`))


