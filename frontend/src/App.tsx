import { RTVIClient } from "@pipecat-ai/client-js";
import { DailyTransport } from "@pipecat-ai/daily-transport";
import { RTVIClientProvider, RTVIClientAudio } from "@pipecat-ai/client-react";
import SpellBeeGame from "./components/SpellBeeGame";

const client = new RTVIClient({
  transport: new DailyTransport(),
  params: {
    baseUrl: "/api",
    endpoints: {
      connect: "/connect",
    },
  },
  enableMic: true,
  enableCam: false,
});

function App() {
  return (
    <RTVIClientProvider client={client}>
      <RTVIClientAudio />
      <SpellBeeGame />
    </RTVIClientProvider>
  );
}

export default App;
