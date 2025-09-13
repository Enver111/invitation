import { useEffect, useRef } from "react";
import "./index.css";
import Envelope from "./components/Envelope";

function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Start audio on first user interaction (mobile autoplay policy)
  useEffect(() => {
    const startAudio = () => {
      if (audioRef.current) {
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {});
      }
      window.removeEventListener("touchstart", startAudio);
      window.removeEventListener("click", startAudio);
    };
    window.addEventListener("touchstart", startAudio, { once: true });
    window.addEventListener("click", startAudio, { once: true });
    return () => {
      window.removeEventListener("touchstart", startAudio);
      window.removeEventListener("click", startAudio);
    };
  }, []);

  return (
    <div className="bg-animated-gradient full-screen w-full flex items-center justify-center">
      <audio ref={audioRef} src="/music.mp3" preload="auto" loop />
      <div className="w-full max-w-sm px-4 py-6">
        <Envelope
          onOpen={() => {
            const a = audioRef.current;
            if (a) {
              a.currentTime = 0;
              a.volume = 0.6;
              a.play().catch(() => {});
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;
