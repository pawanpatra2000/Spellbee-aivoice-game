import { PipecatClient } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import {
  PipecatClientProvider,
  PipecatClientAudio,
} from "@pipecat-ai/client-react";
import SpellBeeGame from "./components/SpellBeeGame";
import "./App.css";

const client = new PipecatClient({
  transport: new SmallWebRTCTransport(),
  enableMic: true,
  enableCam: false,
});

function App() {
  return (
    <PipecatClientProvider client={client}>
      <PipecatClientAudio />
      <div className="spell-bee-container">
        <div className="header">
          <h1>Spell Bee</h1>
          <p>Voice-powered spelling bee game</p>
        </div>
        <SpellBeeGame />
      </div>
    </PipecatClientProvider>
  );
}

export default App;
