
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, SwitchCamera, Ban, ImageDown, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    // Check if device has multiple cameras
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      })
      .catch(error => console.error("Error checking cameras:", error));
    
    // Start camera
    startCamera();

    // Clean up on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // When facingMode changes, restart the camera
  useEffect(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    startCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setPermissionDenied(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setPermissionDenied(true);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      setCapturing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to the canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const imageSrc = canvas.toDataURL('image/jpeg');
        
        // Simply return the captured image without analyzing
        onCapture(imageSrc);
        setCapturing(false);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  if (permissionDenied) {
    return (
      <div className="p-6 flex flex-col items-center text-center space-y-4">
        <Ban className="h-16 w-16 text-destructive mb-2" />
        <h3 className="text-xl font-semibold">Camera Access Denied</h3>
        <p className="text-muted-foreground">
          We need camera access to capture images. Please enable camera access in your browser settings and try again.
        </p>
        <div className="flex space-x-4 mt-4">
          <Button variant="outline" onClick={startCamera}>
            Try Again
          </Button>
          <Button onClick={onClose}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-container flex flex-col space-y-4">
      <div className="relative w-full bg-black rounded-lg overflow-hidden">
        <video 
          ref={videoRef}
          className="w-full h-auto"
          autoPlay
          playsInline
          muted
        />
        
        {/* Hidden canvas for capturing frames */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        
        <div className="flex space-x-2">
          {hasMultipleCameras && (
            <Button variant="outline" onClick={switchCamera} title="Switch Camera">
              <SwitchCamera className="h-5 w-5" />
            </Button>
          )}
          
          <Button onClick={captureImage} className="bg-collector-navy" disabled={capturing}>
            {capturing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <Camera className="h-5 w-5 mr-2" />
                Capture
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
