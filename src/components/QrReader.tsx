import React, { useEffect, useRef, useState } from 'react';
import "barcode-detector/side-effects";
import { BarcodeDetector } from "barcode-detector";

const QrReader = () => {
  const videoElmRef = useRef<HTMLVideoElement>(null);
  const [startScanned, setStartScanned] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scannedData, setScannedData] = useState<string>('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const requestVideo = async (constraints: MediaStreamConstraints) => {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoElmRef.current) {
          videoElmRef.current.srcObject = stream;
        }
        return true;
      } catch (error: any) {
        if (error.name === 'OverconstrainedError') {
          return false; // Return false indicating failure
        }
        throw error; // Rethrow other errors
      }
    };

    const setupCamera = async () => {
      const constraintsHighRes: MediaStreamConstraints = {
        video: {
          facingMode: { exact: "environment" },
          width: { min: 1024, ideal: 4096, max: 4096 },
          height: { min: 540, ideal: 2160, max: 2160 },
          frameRate: { ideal: 60, max: 60 },
        },
        audio: false,
      };

      const constraintsLowerRes: MediaStreamConstraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      // Try high resolution first
      if (!(await requestVideo(constraintsHighRes))) {
        // If high resolution fails, fall back to lower resolution
        if (!(await requestVideo(constraintsLowerRes))) {
          setErrorMessage('Camera not accessible with specified constraints.');
        }
      }

      if (stream) {
        const barcodeDetector = new BarcodeDetector({
          formats: ["qr_code"],
        });

        const detectCode = async () => {
          if (videoElmRef.current && startScanned) {
            const codes = await barcodeDetector.detect(videoElmRef.current);
            if (codes.length > 0) {
              setScannedData(codes[0].rawValue);
              setStartScanned(false); // Stop scanning once a code is detected
            }
          }
        };

        setInterval(detectCode, 100); // Polling interval to detect QR codes
      }
    };

    setupCamera().catch(error => setErrorMessage(error.message));

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div>
      {errorMessage && <p>Error: {errorMessage}</p>}
      <video ref={videoElmRef} autoPlay playsInline />
      {scannedData && <p>Scanned QR Code: {scannedData}</p>}
    </div>
  );
};

export default QrReader;
