import { DataChannel } from "@formant/data-sdk";

export type Fetcher = (
  requestInfo: RequestInfo,
  requestInit?: RequestInit | undefined
) => Promise<RemoteResult>;

export class RemoteResult {
  constructor(private response: RemoteFetchResponse) {}

  async text(): Promise<string> {
    return this.response.contents;
  }

  get status() {
    return this.response.status_code;
  }

  async json(): Promise<string> {
    return JSON.stringify(this.response.contents);
  }
}

interface RemoteFetchResponse {
  id: string;
  status_code: number;
  contents: string;
  proxy_type: string;
}

export function createFetchRemote(channel: DataChannel): Fetcher {
  const requestListeners = new Map<string, (r: RemoteResult) => void>();
  channel.addListener((message) => {
    const r = JSON.parse(message) as RemoteFetchResponse;
    if (r.proxy_type === "http") {
      const listener = requestListeners.get(r.id);
      if (listener) {
        listener(new RemoteResult(r));
      }
    }
  });
  return async function (
    requestInfo: RequestInfo,
    requestInit?: RequestInit | undefined
  ) {
    return new Promise((resolve, reject) => {
      const id = "" + Math.random();
      channel.send(
        JSON.stringify({ id, proxy_type: "http", requestInfo, requestInit })
      );
      requestListeners.set(id, (response) => {
        requestListeners.delete(id);
        resolve(response);
      });
      window.setTimeout(() => {
        requestListeners.delete(id);
        reject(new Error("Request timed out"));
      }, 60 * 1000);
    });
  };
}
