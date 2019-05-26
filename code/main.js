'use strict';

const request = require('request');
//const fs = require('fs');
const sharp = require('sharp');
const { StillCamera } = require("pi-camera-connect");

const express = require('express');
const app = express();

const stillCamera = new StillCamera();

const subscriptionKey = '8b22cb7e2112497c93cd5fec0567f1fb';

// You must use the same location in your REST call as you used to get your
// subscription keys. For example, if you got your subscription keys from
// westus, replace "westcentralus" in the URL below with "westus".
const uriBase = 'https://northeurope.api.cognitive.microsoft.com/face/v1.0/detect';

const imageUrl = './face.jpg';

// Request parameters.
const faceRequestParams = {
	'returnFaceId': 'true',
	'returnFaceLandmarks': 'false',
	'returnFaceAttributes': 'emotion'
};


app.get('/camera', function (req, res) {
	// Take a still picture
	stillCamera.takeImage().then(image => {
		console.log("image captured");
		// Create POST options
		const postOptions = {
			uri: uriBase,
			qs: faceRequestParams,
			body: image,
			headers: {
				'Content-Type': 'application/octet-stream',
				'Ocp-Apim-Subscription-Key': subscriptionKey
			}
		};
		// Making POST request
		console.log("making a POST request to Azure Face API...");
		request.post(postOptions, (error, response, body) => {
			if (error) {
				console.log('Error: ', error);
				return;
			}

			let jsonData = {};
			let azureData = JSON.parse(body);
			if (azureData.length > 0) {
				// take only the first face
				let faceData = azureData[0];
				let faceDataRect = faceData.faceRectangle;
				console.log(faceDataRect);
				// Crop the image
				sharp(originalImage).extract({ width: faceDataRect.width, height: faceDataRect.height, left: faceDataRect.left, top: faceDataRect.top }).toBuffer()
					.then(function (image) {
						jsonData.faceImg = image;
						console.log("Image cropped and saved");
					})
					.catch(function (err) {
						console.log("An error occured cropping the face");
						console
					});
					jsonData.emotion = faceData.faceAttributes.emotion;
			}
			let jsonResponse = JSON.stringify(jsonData, null, '  ');
			console.log('JSON Response\n');
			console.log(jsonResponse);
			res.status(200).send(jsonResponse);
		});
	});
});

// Express route for any other unrecognised incoming requests
app.get('*', function (req, res) {
	res.status(404).send('Unrecognised API call');
});

// Express route to handle errors
app.use(function (err, req, res, next) {
	if (req.xhr) {
		res.status(500).send('Oops, Something went wrong!');
	} else {
		next(err);
	}
});

app.listen(3000);
console.log('App Server running at port 3000');

