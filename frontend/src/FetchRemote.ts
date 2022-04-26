import { DataChannel } from "@formant/data-sdk";

export type Fetcher = (
  requestInfo: RequestInfo,
  requestInit?: RequestInit | undefined
) => Promise<void>;

export function createFetchRemote(
  channel: DataChannel,
  remoteBase: string
): Fetcher {
  return async function (
    requestInfo: RequestInfo,
    requestInit?: RequestInit | undefined
  ) {
    channel.send(
      JSON.stringify({ proxy_type: "http", requestInfo, requestInit })
    );
    return;
  };
}
