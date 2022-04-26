from flask import Flask, jsonify, request

app = Flask(__name__)


@app.route("/test", methods=["GET"])
def hello_world_get():
    return jsonify({"return_message": "hello world"})


@app.route("/test", methods=["POST"])
def hello_world_post():
    return jsonify({"return_message": "goodye world"})
