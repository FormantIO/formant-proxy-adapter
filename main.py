import time
import json
import random
import requests

from formant.sdk.agent.v1 import Client as FormantAgentClient

CHANNEL_NAME = "http_websocket_proxy"

if __name__ == "__main__":
    fclient = FormantAgentClient("localhost:5501")

    def example_channel_callback(message):
        requestData = json.loads(message.payload)
        id = requestData["id"]
        print(message)
        if ("requestInit" in requestData) == False or requestData["requestInit"][
            "method"
        ] == "GET":
            r = requests.get(requestData["requestInfo"])
            fclient.send_on_custom_data_channel(
                CHANNEL_NAME,
                json.dumps(
                    {"id": id, "status_code": r.status_code, "contents": r.text}
                ).encode("utf-8"),
            )
        elif requestData["requestInit"]["method"] == "POST":
            r = requests.post(
                requestData["requestInfo"], data=requestData["requestInit"]["body"]
            )
            fclient.send_on_custom_data_channel(
                CHANNEL_NAME,
                json.dumps(
                    {"id": id, "status_code": r.status_code, "contents": r.text}
                ).encode("utf-8"),
            )
        else:
            raise "Unsupported"

    # Listen to data from the custom web application
    fclient.register_custom_data_channel_message_callback(
        example_channel_callback, channel_name_filter=[CHANNEL_NAME]
    )

    while True:
        time.sleep(0.1)
