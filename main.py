import time
import json
import requests
import threading
import asyncio
import websockets
import queue

websocket_queues = {}


class WebSocketSession(threading.Thread):
    def __init__(self, id, fclient, url, queue):
        self.__id = id
        self.__fclient = fclient
        self.__url = url
        self.__queue = queue
        self.__websocket = None
        threading.Thread.__init__(self)

    def run(self):
        async def forward_messages():
            print("starting forwarder")
            while True:
                try:
                    msg = self.__queue.get(block=False)
                except queue.Empty:
                    pass
                else:
                    if self.__websocket is not None:
                        if msg["signal"] == "close":
                            print("closing websocket for " + self.__id)
                            await self.__websocket.close()
                            return
                        elif msg["signal"] == "message":
                            await self.__websocket.send(msg["data"])
                        else:
                            print("unknown message")
                            print(msg)
                            raise Exception("unknown message")
                await asyncio.sleep(0)

        async def listen_messages():
            print(self.__id + " connecting to websocket proxy " + str(self.__url))
            async with websockets.connect(self.__url) as websocket:
                self.__websocket = websocket
                print(self.__id + " websocket connected")
                self.__fclient.send_on_custom_data_channel(
                    CHANNEL_NAME,
                    json.dumps(
                        {"id": self.__id, "proxy_type": "ws", "event": "open"}
                    ).encode("utf-8"),
                )
                try:
                    while True:
                        msg = await websocket.recv()
                        self.__fclient.send_on_custom_data_channel(
                            CHANNEL_NAME,
                            json.dumps(
                                {
                                    "id": self.__id,
                                    "proxy_type": "ws",
                                    "event": "message",
                                    "contents": msg,
                                }
                            ).encode("utf-8"),
                        )
                except websockets.ConnectionClosed:
                    self.__websocket = None
                    print(self.__id + " websocket closed")
                self.__fclient.send_on_custom_data_channel(
                    CHANNEL_NAME,
                    json.dumps(
                        {"id": self.__id, "proxy_type": "ws", "event": "close"}
                    ).encode("utf-8"),
                )

        async def start():
            print("starting websocket proxy")
            await asyncio.gather(forward_messages(), listen_messages())

        asyncio.run(start())


from formant.sdk.agent.v1 import Client as FormantAgentClient

CHANNEL_NAME = "http_websocket_proxy"


def main():
    fclient = FormantAgentClient("localhost:5501")

    async def callback(message):
        requestData = json.loads(message.payload)
        id = requestData["id"]
        if requestData["proxy_type"] == "ws":
            if requestData["signal"] == "connect":
                q = queue.Queue()
                websocket_queues[id] = q
                WebSocketSession(id, fclient, requestData["url"], q).start()
            else:
                q = websocket_queues[id]
                if q is not None:
                    q.put(requestData)
        if requestData["proxy_type"] == "http":
            if ("requestInit" in requestData) == False or requestData["requestInit"][
                "method"
            ] == "GET":
                r = requests.get(requestData["requestInfo"])
                fclient.send_on_custom_data_channel(
                    CHANNEL_NAME,
                    json.dumps(
                        {
                            "id": id,
                            "proxy_type": "http",
                            "status_code": r.status_code,
                            "contents": r.text,
                        }
                    ).encode("utf-8"),
                )
            elif ("requestInit" in requestData) == False or requestData["requestInit"][
                "method"
            ] == "DELETE":
                r = requests.delete(requestData["requestInfo"])
                fclient.send_on_custom_data_channel(
                    CHANNEL_NAME,
                    json.dumps(
                        {
                            "id": id,
                            "proxy_type": "http",
                            "status_code": r.status_code,
                            "contents": r.text,
                        }
                    ).encode("utf-8"),
                )
            elif requestData["requestInit"]["method"] == "POST":
                r = requests.post(
                    requestData["requestInfo"], data=requestData["requestInit"]["body"]
                )
                fclient.send_on_custom_data_channel(
                    CHANNEL_NAME,
                    json.dumps(
                        {
                            "id": id,
                            "proxy_type": "http",
                            "status_code": r.status_code,
                            "contents": r.text,
                        }
                    ).encode("utf-8"),
                )
            elif requestData["requestInit"]["method"] == "PUT":
                r = requests.put(
                    requestData["requestInfo"], data=requestData["requestInit"]["body"]
                )
                fclient.send_on_custom_data_channel(
                    CHANNEL_NAME,
                    json.dumps(
                        {
                            "id": id,
                            "proxy_type": "http",
                            "status_code": r.status_code,
                            "contents": r.text,
                        }
                    ).encode("utf-8"),
                )
            else:
                raise "Unsupported"

    def example_channel_callback(message):
        asyncio.run(callback(message))

    # Listen to data from the custom web application
    fclient.register_custom_data_channel_message_callback(
        example_channel_callback, channel_name_filter=[CHANNEL_NAME]
    )

    while True:
        time.sleep(0.1)


if __name__ == "__main__":
    main()
