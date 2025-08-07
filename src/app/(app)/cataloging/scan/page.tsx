/**
 * Barcode Scanning Page
 * 
 * Web-based barcode scanning using camera and QuaggaJS
 * Falls back to manual ISBN entry if scanning fails
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Camera, 
  CameraOff,
  Flashlight,
  FlashlightOff,
  Type,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

// Import QuaggaJS with type assertion
const Quagga = require('quagga') as any;


// QuaggaJS types
interface QuaggaResult {
  codeResult: {
    code: string;
  };
}

// Import validation from the real book API service
import { validateISBN } from '@/lib/services/book-api';

export default function BarcodeScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [scannerState, setScannerState] = useState<'initializing' | 'ready' | 'scanning' | 'error' | 'disabled'>('initializing');
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle detected barcode (matches mobile app flow)
  const handleBarcodeDetected = useCallback((isbn: string) => {
    // Validate the detected ISBN
    if (!validateISBN(isbn)) {
      toast.error('Invalid barcode detected. Please try again.');
      return;
    }

    // Stop scanner
    if (scannerRef.current) {
      Quagga.stop();
    }
    setScannerState('ready');

    // Navigate to review page with ISBN (matches mobile app)
    router.push(`/cataloging/review/${isbn}`);
    
    toast.success('Barcode detected! Loading book details...');
  }, [router]);

  // Start QuaggaJS scanner
  const startQuagga = useCallback(() => {
    if (!videoRef.current) return;

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment"
        }
      },
      decoder: {
        readers: ["ean_reader", "ean_8_reader"] // For ISBN barcodes
      },
      locate: true,
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 2,
      frequency: 10
    }, (err: Error | null) => {
      if (err) {
        console.error('QuaggaJS initialization failed:', err);
        setScannerState('error');
        toast.error('Failed to initialize barcode scanner');
        return;
      }

      // Set up detection handler
      Quagga.onDetected((result: QuaggaResult) => {
        const code = result.codeResult.code;
        if (code && code.length >= 10) { // Valid ISBN length
          handleBarcodeDetected(code);
        }
      });

      Quagga.start();
      scannerRef.current = true;
      setScannerState('scanning');

      // Auto-timeout after 30 seconds
      timeoutRef.current = setTimeout(() => {
        toast.info('Having trouble scanning? Try manual entry instead.');
      }, 30000);
    });
  }, [handleBarcodeDetected]);

  // Toggle flash/torch
  const toggleFlash = useCallback(async () => {
    if (!flashSupported || !streamRef.current) return;

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ torch: !isFlashOn } as any]
      });
      setIsFlashOn(!isFlashOn);
    } catch (error) {
      console.error('Flash toggle failed:', error);
      toast.error('Failed to toggle flash');
    }
  }, [isFlashOn, flashSupported]);

  // Cleanup
  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      Quagga.stop();
      scannerRef.current = false;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Initialize camera and scanner
  const initializeScanner = useCallback(async () => {
    try {
      setScannerState('initializing');

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if flash/torch is supported
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
      setFlashSupported(!!(capabilities as MediaTrackCapabilities & { torch?: boolean }).torch);

      // Initialize QuaggaJS scanner
      startQuagga();

    } catch (error) {
      console.error('Camera initialization failed:', error);
      setCameraPermission('denied');
      setScannerState('error');
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please enable camera access to scan barcodes.');
      } else {
        toast.error('Failed to initialize camera. You can still enter ISBN manually.');
      }
    }
  }, [startQuagga]);

  // Initialize on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      initializeScanner();
    } else {
      setScannerState('disabled');
      toast.error('Camera not supported in this browser');
    }

    return stopScanner;
  }, [initializeScanner, stopScanner]);



  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/20">
            <Link href="/cataloging">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold text-white">Scan Barcode</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Scanner Area */}
        <div className="relative max-w-2xl mx-auto">
          {/* Video element */}
          <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Scanning overlay */}
            {scannerState === 'scanning' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning frame */}
                  <div className="w-64 h-40 border-2 border-white rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                    
                    {/* Animated scan line */}
                    <div className="absolute inset-x-4 top-1/2 h-0.5 bg-primary animate-pulse"></div>
                  </div>
                  
                  {/* Instructions */}
                  <p className="text-white text-center mt-4 text-sm">
                    Point camera at the barcode
                  </p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {(scannerState === 'initializing' || isProcessing) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">
                    {scannerState === 'initializing' ? 'Starting camera...' : 'Processing barcode...'}
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {scannerState === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <CameraOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg mb-2">Camera Not Available</p>
                  <p className="text-sm text-gray-400">
                    Please check permissions or try manual entry
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center gap-8 mt-8">
            {/* Flash toggle */}
            <Button
              variant={isFlashOn ? "default" : "outline"}
              size="lg"
              onClick={toggleFlash}
              disabled={!flashSupported || scannerState !== 'scanning'}
              className={`${isFlashOn ? 'bg-primary' : 'bg-white/20 border-white/40 text-white hover:bg-white/30'}`}
            >
              {isFlashOn ? (
                <FlashlightOff className="h-6 w-6" />
              ) : (
                <Flashlight className="h-6 w-6" />
              )}
            </Button>

            {/* Manual entry button */}
            <Button
              variant="outline"
              size="lg" 
              asChild
              className="bg-white/20 border-white/40 text-white hover:bg-white/30"
            >
              <Link href="/cataloging/isbn">
                <Type className="h-6 w-6 mr-2" />
                Manual Entry
              </Link>
            </Button>

            {/* Try again button (when error) */}
            {scannerState === 'error' && cameraPermission !== 'denied' && (
              <Button
                variant="outline"
                size="lg"
                onClick={initializeScanner}
                className="bg-white/20 border-white/40 text-white hover:bg-white/30"
              >
                <Camera className="h-6 w-6 mr-2" />
                Try Again
              </Button>
            )}
          </div>

          {/* Help text */}
          <div className="mt-8 max-w-md mx-auto">
            {scannerState === 'scanning' ? (
              <p className="text-center text-white/80 text-sm">
                Position the barcode within the frame. The ISBN is usually on the back cover.
              </p>
            ) : scannerState === 'error' && cameraPermission === 'denied' ? (
              <Alert className="bg-red-950 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-red-200">Camera Permission Required</AlertTitle>
                <AlertDescription className="text-red-300">
                  To scan barcodes, please allow camera access in your browser settings.
                  You can also use manual ISBN entry instead.
                </AlertDescription>
              </Alert>
            ) : scannerState === 'disabled' ? (
              <Alert className="bg-yellow-950 border-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-yellow-200">Camera Not Supported</AlertTitle>
                <AlertDescription className="text-yellow-300">
                  Your browser doesn&apos;t support camera access. Please use manual ISBN entry.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}