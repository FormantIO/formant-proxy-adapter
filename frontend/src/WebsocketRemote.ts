import { DataChannel } from "@formant/data-sdk";

type WebSocketEventTypes = "open" | "message" | "error" | "close";

interface RemoteWebSocketResponse {
  id: string;
  event: WebSocketEventTypes;
  contents: string;
  proxy_type: string;
}

export interface WebsocketRemoteEvent {
  data: string;
}

export class WebSocketRemote {
  id: string = "" + Math.random();
  handlers: [WebSocketEventTypes, (e: WebsocketRemoteEvent) => void][] = [];
  constructor(private channel: DataChannel, url: string) {
    channel.addListener((message) => {
      const r = JSON.parse(message) as RemoteWebSocketResponse;
      if (r.proxy_type === "ws" && r.id === this.id) {
        const listeners = this.handlers.filter(([e, h]) => e === r.event);
        listeners.forEach(([e, h]) => {
          const closeEvent = { data: r.contents };
          h(closeEvent);
        });
      }
    });
    this.channel.send(
      JSON.stringify({ id: this.id, proxy_type: "ws", signal: "connect", url })
    );
  }

  addEventListener(
    event: WebSocketEventTypes,
    handler: (e: WebsocketRemoteEvent) => void
  ) {
    this.handlers.push([event, handler]);
  }

  removeEventListener(
    event: WebSocketEventTypes,
    handler: (e: WebsocketRemoteEvent) => void
  ) {
    const indexToRemove = this.handlers.findIndex(
      ([e, h]) => e === event && h === handler
    );
    if (indexToRemove >= 0) {
      this.handlers.splice(indexToRemove, 1);
    }
  }

  send(data: string) {
    this.channel.send(
      JSON.stringify({ id: this.id, proxy_type: "ws", signal: "message", data })
    );
  }

  close() {
    this.channel.send(
      JSON.stringify({ id: this.id, proxy_type: "ws", signal: "close" })
    );
  }
}
