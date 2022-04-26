import * as React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import { Authentication, Fleet } from "@formant/data-sdk";
import { createFetchRemote, Fetcher } from "./FetchRemote";

function App() {
  const [result, setResult] = useState<string>("");
  const [fetchRemote, setFetchRemote] = useState<Fetcher | undefined>(
    undefined
  );
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

  return (
    <div className="App">
      <header className="App-header">
        {!fetchRemote ? (
          <div>Loading...</div>
        ) : (
          <div>
            <button onClick={sendGet}>Send Get</button>
            <button onClick={sendPost}>Send Post</button>
          </div>
        )}
        <div>{result}</div>
      </header>
    </div>
  );
}

export default App;
