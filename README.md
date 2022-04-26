# Formant proxy adapter

This proxy can be used to communicate with an HTTP server running on a local robot from a webrtc custom view/module.

This project has a few components:

* an adapter in `main.py` that takes webrtc calls from the website, and translates them into http calls on the device
* a simple website for testing `simple_website.py` you can run with `export FLASK_APP=simple_website flask run`
* an example website `frontend` that can e
  * setup using `cd frontend && yarn`
  * and run `yarn dev`

if run locally, you can add a custom view `http://localhost:9146/index.html?device={device_id}&auth={auth}`
