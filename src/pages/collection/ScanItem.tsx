import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  Upload, 
  ArrowRight, 
  Loader2, 
  ArrowLeft,
  Scan,
  FileText,
  ImageIcon,
  Edit,
  UploadCloud,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCollection } from '@/contexts/CollectionContext';
import { toast } from '@/components/ui/use-toast';
import { CollectionItem } from '@/types/collection';
import { useAuth } from '@/contexts/AuthContext';
import CameraCapture, { ImageAnalysisResult } from '@/components/camera/CameraCapture';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ScanItem = () => {
  const navigate = useNavigate();
  const { analyzeItem, addItem } = useCollection();
  const { user } = useAuth();
  
  const [activeStep, setActiveStep] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [scanResults, setScanResults] = useState<Partial<CollectionItem> | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisResult | null>(null);
  
  // Check if camera is supported
  const [isCameraSupported, setIsCameraSupported] = useState<boolean | null>(null);
  
  React.useEffect(() => {
    // Check if camera is supported
    const checkCameraSupport = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setIsCameraSupported(false);
          return;
        }
        
        // Try to get camera access to confirm support
        await navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            // Camera is supported and permission granted
            setIsCameraSupported(true);
            // Stop the camera stream immediately since we're just checking
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(error => {
            // If permission denied but device has camera
            if (error.name === "NotAllowedError" || error.name === "SecurityError") {
              setIsCameraSupported(true);
            } else {
              setIsCameraSupported(false);
            }
          });
      } catch (err) {
        setIsCameraSupported(false);
      }
    };
    
    checkCameraSupport();
  }, []);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // For demo purposes, we'll use URL.createObjectURL
    // In a real app, we'd upload these to a server
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    setImages(prevImages => [...prevImages, ...newImages]);
  };
  
  const handleCameraCapture = (imageSrc: string, analysis?: ImageAnalysisResult) => {
    setImages(prevImages => [...prevImages, imageSrc]);
    setIsCameraActive(false);
    
    if (analysis) {
      setImageAnalysis(analysis);
      
      // Use analysis to pre-fill some fields
      if (!itemName && analysis.primaryObject?.style) {
        const suggestedName = `${analysis.primaryObject.style} Item`;
        setItemName(suggestedName);
      }
      
      // Set a category if one can be inferred
      if (!category && analysis.primaryObject?.possibleFunctions?.length) {
        const suggestedCategory = analysis.primaryObject.possibleFunctions[0];
        setCategory(suggestedCategory);
      }
      
      toast({
        title: "Image analyzed",
        description: "The object details have been analyzed",
      });
    }
    
    // Auto-switch to upload tab after capture
    setActiveTab("upload");
  };
  
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  const handleScan = async () => {
    if (!images.length && (!itemName || !category)) {
      toast({
        title: "Missing information",
        description: "Please upload an image or provide a name and category",
        variant: "destructive",
      });
      return;
    }
    
    setScanning(true);
    
    try {
      // If we have image analysis, enhance the request with that data
      const enhancedDescription = imageAnalysis ? 
        `${imageAnalysis.primaryObject.shape} object made of ${imageAnalysis.primaryObject.material}. ` +
        `${imageAnalysis.primaryObject.texture} texture with ${imageAnalysis.primaryObject.colors.dominant} color. ` +
        `${imageAnalysis.additionalObservations}` : 
        undefined;
      
      const scanRequest = {
        name: itemName,
        category,
        images,
        description: enhancedDescription
      };
      
      const scanResult = await analyzeItem(scanRequest);
      
      // If we have image analysis, enhance the scan results
      if (imageAnalysis) {
        scanResult.condition = scanResult.condition || imageAnalysis.primaryObject.condition || "Good";
        scanResult.type = scanResult.type || imageAnalysis.primaryObject.style || "Unknown";
        scanResult.notes = scanResult.notes || imageAnalysis.additionalObservations;
        scanResult.yearProduced = scanResult.yearProduced || imageAnalysis.primaryObject.timePeriod || "Unknown";
      }
      
      setScanResults(scanResult);
      setActiveStep(2);
      
      toast({
        title: "Scan complete",
        description: "Your item has been analyzed successfully",
      });
    } catch (error) {
      toast({
        title: "Scan failed",
        description: "There was an error analyzing your item",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };
  
  const handleAccept = async () => {
    if (!scanResults || !user) return;
    
    setSaving(true);
    
    try {
      // Combine scan results with uploaded images
      const itemData: Partial<CollectionItem> = {
        ...scanResults,
        userId: user.id,
        images,
        name: scanResults.name || itemName,
        category: scanResults.category || category
      };
      
      const newItem = await addItem(itemData as CollectionItem);
      
      toast({
        title: "Item added",
        description: `${newItem.name} has been added to your collection`,
      });
      
      navigate(`/collection/${newItem.id}`);
    } catch (error) {
      toast({
        title: "Error saving item",
        description: "There was an error adding the item to your collection",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleEdit = () => {
    if (!scanResults || !user) return;
    
    // Combine scan results with uploaded images
    const itemData: Partial<CollectionItem> = {
      ...scanResults,
      userId: user.id,
      images,
      name: scanResults.name || itemName,
      category: scanResults.category || category
    };
    
    // Store in sessionStorage to be accessed by the edit page
    sessionStorage.setItem('scanResults', JSON.stringify(itemData));
    navigate('/add-item');
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render image upload and camera UI based on step
  const renderImageInput = () => {
    if (isCameraActive) {
      return (
        <CameraCapture 
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraActive(false)}
        />
      );
    }
    
    return (
      <Tabs 
        defaultValue="upload" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Images
          </TabsTrigger>
          
          {isCameraSupported && (
            <TabsTrigger value="camera">
              <Camera className="mr-2 h-4 w-4" />
              Use Camera
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="upload" className="mt-4">
          <div className="flex items-center justify-center w-full">
            <label 
              htmlFor="images"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
              <Input 
                id="images" 
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </TabsContent>
        
        {isCameraSupported && (
          <TabsContent value="camera" className="mt-4">
            <div className="flex flex-col items-center justify-center w-full space-y-4">
              <div className="text-center space-y-2">
                <Camera className="w-12 h-12 mx-auto text-collector-navy" />
                <p className="text-gray-600">
                  Take photos directly with your device camera
                </p>
              </div>
              
              <Button 
                size="lg" 
                className="w-full md:w-auto"
                onClick={() => setIsCameraActive(true)}
              >
                <Camera className="mr-2 h-5 w-5" />
                Open Camera
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    );
  };

  // Render image analysis details if available
  const renderImageAnalysisDetails = () => {
    if (!imageAnalysis) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Image Analysis Details
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="space-y-3">
            <div>
              <p className="font-medium">Object Shape:</p>
              <p className="text-muted-foreground">{imageAnalysis.primaryObject.shape}</p>
            </div>
            
            <div>
              <p className="font-medium">Colors:</p>
              <p className="text-muted-foreground">
                Dominant: {imageAnalysis.primaryObject.colors.dominant}<br />
                Accents: {imageAnalysis.primaryObject.colors.accents.join(", ")}
              </p>
            </div>
            
            <div>
              <p className="font-medium">Material & Texture:</p>
              <p className="text-muted-foreground">
                {imageAnalysis.primaryObject.material} with {imageAnalysis.primaryObject.texture.toLowerCase()} texture
              </p>
            </div>
            
            {imageAnalysis.primaryObject.distinguishingFeatures && (
              <div>
                <p className="font-medium">Distinguishing Features:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                  {imageAnalysis.primaryObject.distinguishingFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {imageAnalysis.primaryObject.timePeriod && (
              <div>
                <p className="font-medium">Time Period:</p>
                <p className="text-muted-foreground">{imageAnalysis.primaryObject.timePeriod}</p>
              </div>
            )}
            
            {imageAnalysis.primaryObject.style && (
              <div>
                <p className="font-medium">Style:</p>
                <p className="text-muted-foreground">{imageAnalysis.primaryObject.style}</p>
              </div>
            )}
            
            {imageAnalysis.primaryObject.condition && (
              <div>
                <p className="font-medium">Condition:</p>
                <p className="text-muted-foreground">{imageAnalysis.primaryObject.condition}</p>
              </div>
            )}
            
            {imageAnalysis.additionalObservations && (
              <div>
                <p className="font-medium">Additional Observations:</p>
                <p className="text-muted-foreground">{imageAnalysis.additionalObservations}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout title="Scan Item">
      <div className="container max-w-7xl mx-auto px-4 pb-12">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              activeStep >= 1 ? 'bg-collector-navy text-white' : 'bg-gray-200'
            }`}>
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              activeStep >= 2 ? 'bg-collector-navy' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              activeStep >= 2 ? 'bg-collector-navy text-white' : 'bg-gray-200'
            }`}>
              <Scan className="h-5 w-5" />
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              activeStep >= 3 ? 'bg-collector-navy' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              activeStep >= 3 ? 'bg-collector-navy text-white' : 'bg-gray-200'
            }`}>
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span>Upload Images</span>
            <span>Analyze</span>
            <span>Review Results</span>
          </div>
        </div>
        
        {activeStep === 1 && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="mr-2 h-5 w-5" />
                  {isCameraActive ? "Camera Capture" : "Upload Images for Analysis"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderImageInput()}
                
                {images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Uploaded Images</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-md overflow-hidden border">
                            <img 
                              src={image} 
                              alt={`Uploaded ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {renderImageAnalysisDetails()}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Item Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name (Optional)</Label>
                  <Input
                    id="itemName"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Enter item name if known"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Coins, Trading Cards, Comics"
                  />
                </div>
                
                <Button 
                  onClick={handleScan} 
                  disabled={scanning || (!images.length && (!itemName || !category))}
                  className="w-full"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Analyze Item
                    </>
                  )}
                </Button>
                
                <div className="text-sm text-gray-500 space-y-2">
                  <p>
                    <strong>Note:</strong> For best results, please upload clear images of your item from multiple angles in good lighting.
                  </p>
                  <p>
                    AI analysis works best with common collectible categories like coins, trading cards, action figures, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeStep === 2 && scanResults && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  {images.length > 0 && (
                    <div className="mb-6">
                      <div className="aspect-square rounded-md overflow-hidden border mb-4">
                        <img 
                          src={images[0]} 
                          alt="Item" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      {images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {images.slice(1, 5).map((image, index) => (
                            <div key={index} className="aspect-square rounded-md overflow-hidden border">
                              <img 
                                src={image} 
                                alt={`Item angle ${index + 2}`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{scanResults.name || itemName}</h3>
                      <p className="text-gray-500">{scanResults.category || category}</p>
                    </div>
                    
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Estimated Value</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(scanResults.priceEstimate?.marketValue || 0)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Confidence</p>
                        <div className={`text-sm px-2 py-1 rounded-full font-medium 
                          ${scanResults.confidenceScore?.level === 'high' ? 'confidence-high' : 
                            scanResults.confidenceScore?.level === 'medium' ? 'confidence-medium' : 
                            'confidence-low'}`}>
                          {scanResults.confidenceScore?.score || 0}% ({scanResults.confidenceScore?.level || 'low'})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Identification</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <p><strong>Type:</strong> {scanResults.type}</p>
                      <p><strong>Manufacturer:</strong> {scanResults.manufacturer}</p>
                      <p><strong>Year:</strong> {scanResults.yearProduced}</p>
                      <p><strong>Edition:</strong> {scanResults.edition}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Condition</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <p><strong>Overall:</strong> {scanResults.condition}</p>
                      <p><strong>Flaws:</strong> {scanResults.flaws}</p>
                      <p><strong>Completeness:</strong> {scanResults.completeness}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Physical Attributes</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <p><strong>Dimensions:</strong> {scanResults.dimensions}</p>
                      <p><strong>Weight:</strong> {scanResults.weight}</p>
                    </div>
                  </div>
                  
                  {scanResults.notes && (
                    <div>
                      <h3 className="font-medium mb-1">Additional Notes</h3>
                      <div className="bg-gray-50 p-3 rounded">
                        <p>{scanResults.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Scanning
                </Button>
                
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Before Saving
                  </Button>
                  
                  <Button
                    onClick={handleAccept}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Accept Results
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ScanItem;
