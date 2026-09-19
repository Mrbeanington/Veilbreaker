import { useEffect, useRef, useState } from "react";
import { decodeQr } from "@veilbreak/persistence";

// The in-app camera scanner (spec/06): the decoder is bundled with the game, and
// no frame ever leaves the device. Needs a secure context and camera permission;
// when either is missing the player is pointed at pasting the code instead.
export function QrScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState("Starting the camera...");

  useEffect(() => {
    let stream: MediaStream | undefined;
    let frame = 0;
    let stopped = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage("This browser cannot use the camera here. Paste the code instead.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        setMessage("The camera is not available or was not allowed. Paste the code instead.");
        return;
      }
      const el = video.current;
      if (!el || stopped) return;
      el.srcObject = stream;
      await el.play().catch(() => undefined);
      setMessage("Point the camera at the code on your other device.");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const tick = () => {
        if (stopped || !context) return;
        if (el.readyState >= 2 && el.videoWidth > 0) {
          canvas.width = el.videoWidth;
          canvas.height = el.videoHeight;
          context.drawImage(el, 0, 0);
          const image = context.getImageData(0, 0, canvas.width, canvas.height);
          const found = decodeQr({ data: image.data, width: image.width, height: image.height });
          if (found) {
            onCode(found);
            return;
          }
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }
    void start();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCode]);

  return (
    <div className="scanner">
      <video ref={video} muted playsInline aria-label="Camera view" />
      <p role="status">{message}</p>
      <button type="button" className="btn" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
