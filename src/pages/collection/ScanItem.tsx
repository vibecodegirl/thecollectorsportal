import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Info,
  Save,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCollection, VisionAnalysisResult } from '@/contexts/CollectionContext';
import { toast } from '@/components/ui/use-toast';
import { CollectionItem } from '@/types/collection';
import { useAuth } from '@/contexts/AuthContext';
import CameraCapture from '@/components/camera/CameraCapture';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { debounce } from 'lodash';
import { useGalleryNavigation } from '@/utils/navigation';

const ScanItem = () => {
  const navigate = useNavigate();
  const navigateToGallery = useGalleryNavigation();
  const { analyzeItem, analyzeImage, addItem, updateItem } = useCollection();
  const { user } = useAuth();
  
  const [activeStep, setActiveStep] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editableItem, setEditableItem] = useState<Partial<CollectionItem> | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [scanResults, setScanResults] = useState<Partial<CollectionItem> | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [imageAnalysis, setImageAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [temporaryId, setTemporaryId] = useState<string | null>(null);
  
  const [isCameraSupported, setIsCameraSupported] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (activeStep === 2 && editableItem && temporaryId) {
      handleAutoSave();
    }
  }, [editableItem]);
  
  const handleAutoSave = debounce(async () => {
    if (!editableItem || !temporaryId || !user) return;
    
    try {
      setAutoSaveStatus('saving');
      
      localStorage.setItem(`temp_scan_item_${temporaryId}`, JSON.stringify(editableItem));
      
      setAutoSaveStatus('saved');
      
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error("Auto-save error:", error);
      setAutoSaveStatus('idle');
    }
  }, 1000);
  
  React.useEffect(() => {
    const checkCameraSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsCameraSupported(false);
        return;
      }
      
      await navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          setIsCameraSupported(true);
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(error => {
          if (error.name === "NotAllowedError" || error.name === "SecurityError") {
            setIsCameraSupported(true);
          } else {
            setIsCameraSupported(false);
          }
        });
    };
    
    checkCameraSupport();
    
    setTemporaryId(`temp_${Date.now()}`);
    
    return () => {
      if (temporaryId) {
        localStorage.removeItem(`temp_scan_item_${temporaryId}`);
      }
    };
  }, []);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages(prevImages => [...prevImages, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  const handleCameraCapture = (imageSrc: string) => {
    setImages(prevImages => [...prevImages, imageSrc]);
    setIsCameraActive(false);
    setActiveTab("upload");
  };
  
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  const analyzeImages = async () => {
    if (images.length > 0 && images[0]) {
      setScanning(true);
      try {
        const analysis = await analyzeImage(images[0]);
        setImageAnalysis(analysis);
        
        if (!itemName && analysis.suggestedType) {
          setItemName(analysis.suggestedType);
        }
        
        if (!category && analysis.suggestedCategory) {
          setCategory(analysis.suggestedCategory);
        }
        
        toast({
          title: "Image analyzed",
          description: "The object details have been analyzed using Google Vision AI",
        });
      } catch (error) {
        console.error("Error analyzing image:", error);
        toast({
          title: "Analysis failed",
          description: "There was an error analyzing the image",
          variant: "destructive",
        });
      } finally {
        setScanning(false);
      }
    }
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
      const enhancedDescription = imageAnalysis ? 
        `${imageAnalysis.primaryObject.shape} object made of ${imageAnalysis.primaryObject.material}. ` +
        `${imageAnalysis.primaryObject.texture} texture with ${imageAnalysis.primaryObject.colors.dominant} color. ` +
        `${imageAnalysis.additionalObservations}` : 
        undefined;
      
      const scanRequest = {
        name: itemName || imageAnalysis?.suggestedType,
        category: category || imageAnalysis?.suggestedCategory,
        images,
        description: enhancedDescription
      };
      
      const scanResult = await analyzeItem(scanRequest);
      
      if (imageAnalysis) {
        scanResult.condition = scanResult.condition || "Good";
        scanResult.type = scanResult.type || imageAnalysis.suggestedType || "Unknown";
        scanResult.notes = scanResult.notes || imageAnalysis.additionalObservations;
        scanResult.yearProduced = scanResult.yearProduced || imageAnalysis.primaryObject.timePeriod || "Unknown";
        
        if (imageAnalysis.primaryObject.material && imageAnalysis.primaryObject.material !== "Unknown material") {
          scanResult.primaryObject = scanResult.primaryObject || {
            shape: "Unknown",
            colors: {
              dominant: "Unknown",
              accents: []
            },
            texture: "Unknown",
            material: "Unknown",
            distinguishingFeatures: [],
            style: "Unknown",
            timePeriod: "Unknown",
            function: "Unknown"
          };
          scanResult.primaryObject.material = imageAnalysis.primaryObject.material;
        }
      }
      
      if (!scanResult.priceEstimate || 
          (scanResult.priceEstimate.marketValue === 0 && 
           scanResult.priceEstimate.low === 0 && 
           scanResult.priceEstimate.high === 0 && 
           scanResult.priceEstimate.average === 0)) {
        scanResult.priceEstimate = {
          marketValue: 0,
          low: 0,
          high: 0,
          average: 0
        };
      }
      
      setScanResults(scanResult);
      setEditableItem(scanResult);
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
    if (!editableItem || !user) return;
    
    setSaving(true);
    
    try {
      const { autoSaved, ...cleanedItemData } = editableItem as any;
      
      const itemData: Partial<CollectionItem> = {
        ...cleanedItemData,
        userId: user.id,
        images,
        name: editableItem.name || itemName,
        category: editableItem.category || category
      };
      
      console.log("Sending item data to addItem:", JSON.stringify(itemData, null, 2));
      
      const newItem = await addItem(itemData as CollectionItem);
      
      if (temporaryId) {
        localStorage.removeItem(`temp_scan_item_${temporaryId}`);
      }
      
      toast({
        title: "Item added",
        description: `${newItem.name} has been added to your collection`,
      });
      
      navigateToGallery();
    } catch (error: any) {
      console.error("Error saving item:", error);
      toast({
        title: "Error saving item",
        description: error.message || "There was an error adding the item to your collection",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleEdit = () => {
    if (!scanResults || !user) return;
    
    const itemData: Partial<CollectionItem> = {
      ...scanResults,
      userId: user.id,
      images,
      name: scanResults.name || itemName,
      category: scanResults.category || category,
      status: 'active',
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    sessionStorage.setItem('editItemData', JSON.stringify(itemData));
    navigate('/add-item');
  };
  
  const handleFieldChange = (field: string, value: any) => {
    if (!editableItem) return;
    
    if (field === 'priceEstimate') {
      setEditableItem(prevItem => ({
        ...prevItem,
        priceEstimate: {
          ...prevItem.priceEstimate,
          marketValue: parseFloat(value),
          average: parseFloat(value),
          low: parseFloat(value) * 0.8,
          high: parseFloat(value) * 1.2
        }
      }));
    } else {
      const updatedItem = { ...editableItem, [field]: value };
      setEditableItem(updatedItem);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  const renderImageAnalysisDetails = () => {
    if (!imageAnalysis) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Google Vision AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="space-y-3">
            {imageAnalysis.suggestedType && (
              <div>
                <p className="font-medium">Suggested Type:</p>
                <p className="text-muted-foreground">{imageAnalysis.suggestedType}</p>
              </div>
            )}
            
            {imageAnalysis.suggestedCategory && (
              <div>
                <p className="font-medium">Suggested Category:</p>
                <p className="text-muted-foreground">{imageAnalysis.suggestedCategory}</p>
              </div>
            )}
            
            <div>
              <p className="font-medium">Object Shape:</p>
              <p className="text-muted-foreground">{imageAnalysis.primaryObject.shape}</p>
            </div>
            
            <div>
              <p className="font-medium">Colors:</p>
              <p className="text-muted-foreground">
                Dominant: {imageAnalysis.primaryObject.colors.dominant}<br />
                {imageAnalysis.primaryObject.colors.accents.length > 0 && (
                  <>Accents: {imageAnalysis.primaryObject.colors.accents.join(", ")}</>
                )}
              </p>
            </div>
            
            <div>
              <p className="font-medium">Material & Texture:</p>
              <p className="text-muted-foreground">
                {imageAnalysis.primaryObject.material} with {imageAnalysis.primaryObject.texture.toLowerCase()}
              </p>
            </div>
            
            {imageAnalysis.primaryObject.distinguishingFeatures && imageAnalysis.primaryObject.distinguishingFeatures.length > 0 && (
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
            
            {imageAnalysis.primaryObject.possibleFunctions && imageAnalysis.primaryObject.possibleFunctions.length > 0 && (
              <div>
                <p className="font-medium">Possible Functions:</p>
                <p className="text-muted-foreground">{imageAnalysis.primaryObject.possibleFunctions.join(", ")}</p>
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

  const renderEditableField = (label: string, field: keyof CollectionItem, value: any, type: 'text' | 'textarea' = 'text') => {
    return (
      <div className="space-y-2 mb-4">
        <Label htmlFor={field}>{label}</Label>
        {type === 'textarea' ? (
          <Textarea
            id={field}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="resize-none h-24"
          />
        ) : (
          <Input
            id={field}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        )}
      </div>
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
                    
                    {!imageAnalysis && images.length > 0 && (
                      <Button 
                        variant="outline" 
                        className="mt-4 w-full"
                        onClick={analyzeImages}
                        disabled={scanning}
                      >
                        {scanning ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing Image...
                          </>
                        ) : (
                          <>
                            <Scan className="mr-2 h-4 w-4" />
                            Analyze Image with AI
                          </>
                        )}
                      </Button>
                    )}
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
        
        {activeStep === 2 && editableItem && (
          <Card>
            <CardHeader className="relative">
              <CardTitle>Edit Analysis Results</CardTitle>
              <div className="absolute right-6 top-6">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Auto-saving...
                  </div>
                )}
                {autoSaveStatus === 'saved' && (
                  <div className="flex items-center text-sm text-green-500">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Changes saved
                  </div>
                )}
              </div>
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
                    {renderEditableField('Item Name', 'name', editableItem.name)}
                    {renderEditableField('Category', 'category', editableItem.category)}
                    
                    <div className="flex justify-between">
                      <div className="w-full">
                        <p className="text-sm text-gray-500 mb-1">Estimated Value ($)</p>
                        <Input
                          id="marketValue"
                          type="number"
                          min="0"
                          value={editableItem.priceEstimate?.marketValue || 0}
                          onChange={(e) => handleFieldChange('priceEstimate', e.target.value)}
                          className="w-full"
                        />
                        {editableItem.priceEstimate && editableItem.priceEstimate.marketValue > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            <div>Range: {formatCurrency(editableItem.priceEstimate.low)} - {formatCurrency(editableItem.priceEstimate.high)}</div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Confidence</p>
                        <div className={`text-sm px-2 py-1 rounded-full font-medium 
                          ${editableItem.confidenceScore?.level === 'high' ? 'confidence-high' : 
                            editableItem.confidenceScore?.level === 'medium' ? 'confidence-medium' : 
                            'confidence-low'}`}>
                          {editableItem.confidenceScore?.score || 0}% ({editableItem.confidenceScore?.level || 'low'})
                        </div>
                        {editableItem.confidenceScore?.factors && editableItem.confidenceScore.factors.length > 0 && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => toast({
                                title: "Confidence Factors",
                                description: (
                                  <div className="mt-2 space-y-1">
                                    {editableItem.confidenceScore?.factors?.map((factor, i) => (
                                      <div key={i} className="flex justify-between">
                                        <span>{factor.factor}</span>
                                        <span>+{factor.impact}</span>
                                      </div>
                                    ))}
                                  </div>
                                ),
                              })}
                            >
                              View Factors
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Identification</h3>
                    <div className="space-y-4">
                      {renderEditableField('Type', 'type', editableItem.type)}
                      {renderEditableField('Manufacturer', 'manufacturer', editableItem.manufacturer)}
                      {renderEditableField('Year', 'yearProduced', editableItem.yearProduced)}
                      {renderEditableField('Edition', 'edition', editableItem.edition)}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Condition</h3>
                    <div className="space-y-4">
                      {renderEditableField('Overall Condition', 'condition', editableItem.condition)}
                      {renderEditableField('Flaws', 'flaws', editableItem.flaws)}
                      {renderEditableField('Completeness', 'completeness', editableItem.completeness)}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Physical Attributes</h3>
                    <div className="space-y-4">
                      {renderEditableField('Dimensions', 'dimensions', editableItem.dimensions)}
                      {renderEditableField('Weight', 'weight', editableItem.weight)}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Additional Notes</h3>
                    {renderEditableField('Notes', 'notes', editableItem.notes, 'textarea')}
                  </div>
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
                    Use Advanced Editor
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
                        Save to Collection
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
