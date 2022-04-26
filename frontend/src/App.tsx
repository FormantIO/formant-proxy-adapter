import * as React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import { Authentication, Fleet } from "@formant/data-sdk";
import { createFetchRemote, Fetcher } from "./FetchRemote";
import { WebSocketRemote } from "./WebsocketRemote";

function App() {
  const [result, setResult] = useState<string>("");
  const [wsResult, setWsResult] = useState<string>("");
  const [fetchRemote, setFetchRemote] = useState<Fetcher | undefined>(
    undefined
  );
  const [websocketRemote, setWebsocketRemote] = useState<
    WebSocketRemote | undefined
  >(undefined);
  useEffect(() => {
    (async () => {
      if (!(await Authentication.waitTilAuthenticated())) {
        return;
      }
      const device = await Fleet.getCurrentDevice();
      await device.startRealtimeConnection();
      const channel = await device.createCustomDataChannel(
        "http_websocket_proxy"
      );
      setFetchRemote(() => {
        return createFetchRemote(channel);
      });

      const ws = new WebSocketRemote(channel, "ws://localhost:6000/");
      setWebsocketRemote(ws);
      ws.addEventListener("open", () => {
        setWsResult("web socket opened");
      });
      ws.addEventListener("close", () => {
        setWsResult("web socket closed");
      });
      ws.addEventListener("message", (event) => {
        setWsResult(JSON.stringify(event.data));
      });
    })();
  }, []);

  const sendGet = async () => {
    if (fetchRemote) {
      const result = await fetchRemote("http://localhost:5000/test");
      setResult(result.status + " " + (await result.text()));
    }
  };

  const sendPost = async () => {
    if (fetchRemote) {
      const result = await fetchRemote("http://localhost:5000/test", {
        method: "POST",
        body: "hello",
      });
      setResult(result.status + " " + (await result.text()));
    }
  };

  const sendMessage = () => {
    if (websocketRemote) {
      websocketRemote.send("hello" + new Date().toISOString());
    }
  };

  const closeMessage = () => {
    if (websocketRemote) {
      websocketRemote.close();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {!fetchRemote ? (
          <div>Loading...</div>
        ) : (
          <>
            <div>
              Http:
              <button onClick={sendGet}>Send Get</button>
              <button onClick={sendPost}>Send Post</button>
              <div>{result}</div>
            </div>
            <div>
              Websocket:
              <button onClick={sendMessage}>Send Message</button>
              <button onClick={closeMessage}>Close</button>
              <div>{wsResult}</div>
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
