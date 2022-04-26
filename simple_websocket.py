import asyncio
import websockets


async def echo(websocket, path):
    print("opening websocket at path: " + path)
    async for message in websocket:
        print("echoing " + message)
        await websocket.send(message)
    print("closing websocket at path: " + path)


async def main():
    async with websockets.serve(echo, "localhost", 6000):
        await asyncio.Future()  # run forever


asyncio.run(main())
