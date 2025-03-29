
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, SwitchCamera, Ban, ImageDown, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageSrc: string, analysis?: ImageAnalysisResult) => void;
  onClose: () => void;
}

export interface ImageAnalysisResult {
  primaryObject: {
    shape: string;
    colors: {
      dominant: string;
      accents: string[];
    };
    texture: string;
    material: string;
    distinguishingFeatures: string[];
    timePeriod?: string;
    possibleFunctions?: string[];
    style?: string;
    condition?: string;
  };
  additionalObservations: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

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

  const mockAnalyzeImage = async (imageSrc: string): Promise<ImageAnalysisResult> => {
    // In a real app, this would call an AI service
    // For demo purposes, we'll simulate processing time
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock analysis result
        resolve({
          primaryObject: {
            shape: "Rectangular with rounded corners",
            colors: {
              dominant: "Silver/metallic",
              accents: ["Black", "Gold", "White"]
            },
            texture: "Smooth with engraved markings",
            material: "Metal alloy, possibly silver or nickel with bronze elements",
            distinguishingFeatures: [
              "Engraved serial number",
              "Patina suggesting age",
              "Unique hallmark on bottom edge"
            ],
            timePeriod: "Likely mid-20th century (1950s-1960s)",
            possibleFunctions: ["Decorative", "Commemorative", "Functional tool"],
            style: "Art Deco influence with modernist elements",
            condition: "Good with minor wear consistent with age"
          },
          additionalObservations: "The object shows signs of careful handling over time with minimal damage. The craftsmanship suggests professional manufacturing rather than artisanal production. Several markings indicate potential historical significance."
        });
      }, 1500);
    });
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      setAnalyzing(true);
      
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
        
        // Analyze the image
        try {
          const analysis = await mockAnalyzeImage(imageSrc);
          onCapture(imageSrc, analysis);
        } catch (error) {
          console.error("Error analyzing image:", error);
          onCapture(imageSrc); // Still send the image even if analysis fails
        } finally {
          setAnalyzing(false);
        }
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
          
          <Button onClick={captureImage} className="bg-collector-navy" disabled={analyzing}>
            {analyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
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
