import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCollection } from '@/contexts/CollectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, Undo, ImagePlus, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ItemStatus } from '@/types/collection';
import { useScanner } from '@/hooks/useScanner';
import { navigateToGallery } from '@/utils/navigationUtils';

const ScanItem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCollection();
  const [isSaving, setIsSaving] = useState(false);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [condition, setCondition] = useState('');
  const [type, setType] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<number | undefined>(undefined);
  const [images, setImages] = useState<string[]>([]);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  
  const {
    scanResults,
    isScanning,
    startScan,
    stopScan,
    resetScan,
    error,
    hasCameraPermission
  } = useScanner();
  
  useEffect(() => {
    if (scanResults) {
      setItemName(scanResults.name || '');
      setCategory(scanResults.category || '');
      setNotes(scanResults.notes || '');
      setManufacturer(scanResults.manufacturer || '');
      setCondition(scanResults.condition || '');
      setType(scanResults.type || '');
      setEstimatedValue(scanResults.estimatedValue);
      setImages(scanResults.images || []);
    }
  }, [scanResults]);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    setImages(prevImages => [...prevImages, ...newImages]);
  };
  
  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };
  
  const handleAddToCollection = async () => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to add items",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Merge local edits with scan results
      const finalItemData = {
        userId: user.id,
        images,
        status: 'active' as ItemStatus,
        name: itemName || scanResults.name || 'Scanned Item',
        category: category || scanResults.category || 'Uncategorized',
        notes: notes || scanResults.notes || '',
        manufacturer: manufacturer || scanResults.manufacturer || '',
        condition: condition || scanResults.condition || '',
        type: type || scanResults.type || '',
        priceEstimate: {
          low: estimatedValue ? estimatedValue * 0.8 : 0,
          average: estimatedValue || 0, 
          high: estimatedValue ? estimatedValue * 1.2 : 0,
          marketValue: estimatedValue || 0
        }
      };
      
      // Call the addItem function from context
      const newItem = await addItem(finalItemData);
      
      // Use the navigation utility to go to the gallery
      navigateToGallery(navigate, {
        message: `${newItem.name} has been added to your collection`,
        delay: 500
      });
      
    } catch (error: any) {
      console.error("Error adding to collection:", error);
      toast({
        title: "Error adding item",
        description: error.message || "Failed to add item to your collection",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleEditItem = () => {
    // Store the scan results in session storage
    sessionStorage.setItem('editItemData', JSON.stringify({
      name: itemName || scanResults.name || '',
      category: category || scanResults.category || '',
      notes: notes || scanResults.notes || '',
      manufacturer: manufacturer || scanResults.manufacturer || '',
      condition: condition || scanResults.condition || '',
      type: type || scanResults.type || '',
      priceEstimate: {
        low: estimatedValue ? estimatedValue * 0.8 : 0,
        average: estimatedValue || 0,
        high: estimatedValue ? estimatedValue * 1.2 : 0,
        marketValue: estimatedValue || 0
      },
      images: images || scanResults.images || []
    }));
    
    // Navigate to the AddEditItem page
    navigate('/add-item');
  };
  
  const toggleAdvancedEditor = () => {
    setUseAdvancedEditor(!useAdvancedEditor);
  };
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    switch (name) {
      case 'itemName':
        setItemName(value);
        break;
      case 'category':
        setCategory(value);
        break;
      case 'notes':
        setNotes(value);
        break;
      case 'manufacturer':
        setManufacturer(value);
        break;
      case 'condition':
        setCondition(value);
        break;
      case 'type':
        setType(value);
        break;
      case 'estimatedValue':
        setEstimatedValue(value ? parseFloat(value) : undefined);
        break;
      default:
        break;
    }
  }, []);
  
  return (
    <MainLayout title="Scan Item">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Item Scanner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasCameraPermission === false ? (
              <div className="text-center">
                <p className="text-red-500">Camera permission denied. Please enable camera access in your browser settings.</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="aspect-w-4 aspect-h-3">
                    <div className="w-full h-full overflow-hidden rounded-lg">
                      <video
                        id="scanner-video"
                        className="w-full h-full object-cover"
                        style={{ display: isScanning ? 'block' : 'none' }}
                        muted
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 text-white rounded-lg">
                      <p>Error: {error}</p>
                    </div>
                  )}
                  
                  {!isScanning && !scanResults && (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 text-white rounded-lg">
                      <p>Ready to scan...</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  {isScanning ? (
                    <Button variant="destructive" onClick={stopScan} disabled={!isScanning}>
                      {isScanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Stop Scan
                        </>
                      ) : (
                        "Stop Scan"
                      )}
                    </Button>
                  ) : (
                    <Button onClick={startScan} disabled={isScanning}>
                      {isScanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        "Start Scan"
                      )}
                    </Button>
                  )}
                  
                  <Button variant="secondary" onClick={resetScan} disabled={isScanning}>
                    <Undo className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {scanResults && (
          <Card>
            <CardHeader>
              <CardTitle>Scan Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    type="text"
                    id="itemName"
                    name="itemName"
                    value={itemName}
                    onChange={handleInputChange}
                    placeholder="Item Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    type="text"
                    id="category"
                    name="category"
                    value={category}
                    onChange={handleInputChange}
                    placeholder="Category"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    type="text"
                    id="manufacturer"
                    name="manufacturer"
                    value={manufacturer}
                    onChange={handleInputChange}
                    placeholder="Manufacturer"
                  />
                </div>
                
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Input
                    type="text"
                    id="condition"
                    name="condition"
                    value={condition}
                    onChange={handleInputChange}
                    placeholder="Condition"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Input
                    type="text"
                    id="type"
                    name="type"
                    value={type}
                    onChange={handleInputChange}
                    placeholder="Type"
                  />
                </div>
                
                <div>
                  <Label htmlFor="estimatedValue">Estimated Value</Label>
                  <Input
                    type="number"
                    id="estimatedValue"
                    name="estimatedValue"
                    value={estimatedValue !== undefined ? estimatedValue : ''}
                    onChange={handleInputChange}
                    placeholder="Estimated Value"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={handleInputChange}
                  placeholder="Notes"
                />
              </div>
              
              <div>
                <Label htmlFor="images" className="block mb-2">Upload Images</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="images"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImagePlus className="w-8 h-8 mb-2 text-gray-500" />
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
                
                {images && images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Uploaded Images</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between">
                <Button variant="secondary" onClick={handleEditItem}>
                  Edit in Advanced Editor
                </Button>
                
                <Button
                  onClick={handleAddToCollection}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add to Collection
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ScanItem;
