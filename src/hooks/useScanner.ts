
import { useState, useEffect, useRef } from 'react';

// Define types for scan results
export interface ScanResults {
  name?: string;
  category?: string;
  notes?: string;
  manufacturer?: string;
  condition?: string;
  type?: string;
  estimatedValue?: number;
  images?: string[];
}

export const useScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera when component mounts
  useEffect(() => {
    // Cleanup function to stop camera when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Function to start the camera
  const startCamera = async (): Promise<MediaStream | null> => {
    try {
      if (streamRef.current) {
        return streamRef.current;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      setHasCameraPermission(true);
      return stream;
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError(err.message || 'Failed to access camera');
      setHasCameraPermission(false);
      return null;
    }
  };

  // Function to start scanning
  const startScan = async () => {
    setIsScanning(true);
    setError(null);
    
    try {
      const stream = await startCamera();
      if (!stream) {
        throw new Error('Could not start camera');
      }
      
      const video = document.getElementById('scanner-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.play();
        videoRef.current = video;
        
        // In a real app, we would now start the item detection process
        // For now, we'll simulate a scan after a short delay
        setTimeout(() => {
          // Simulate a successful scan with mock data
          const mockScanResults: ScanResults = {
            name: 'Vintage Baseball Card',
            category: 'Sports Memorabilia',
            notes: 'Good condition, minor edge wear',
            manufacturer: 'Topps',
            condition: 'Good',
            type: 'Baseball Card',
            estimatedValue: 45,
            images: [
              // We would normally capture real images here
              // For now we're just providing placeholders
              '/placeholder.svg'
            ]
          };
          
          setScanResults(mockScanResults);
          setIsScanning(false);
        }, 3000);
      } else {
        throw new Error('Video element not found');
      }
    } catch (err: any) {
      console.error('Error in scan process:', err);
      setError(err.message || 'Error during scanning');
      setIsScanning(false);
    }
  };

  // Function to stop scanning
  const stopScan = () => {
    setIsScanning(false);
    
    // Don't stop the camera stream here so we can resume scanning easily
    // Just stop the scanning process
  };

  // Function to reset the scan
  const resetScan = () => {
    setScanResults(null);
    setError(null);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  return {
    isScanning,
    scanResults,
    error,
    hasCameraPermission,
    startScan,
    stopScan,
    resetScan
  };
};
