import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCollection } from '@/contexts/CollectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, ArrowLeft, Loader2, Trash, Check, Upload } from 'lucide-react';
import { AIAnalysisRequest } from '@/lib/mock-data';
import { toast } from '@/components/ui/use-toast';
import { CollectionItem, ConfidenceScore, PriceEstimate } from '@/types/collection';
import { navigateToGallery } from '@/utils/navigationUtils';

const AddEditItem = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCollection, addItem, updateItem, analyzeItem } = useCollection();
  
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const emptyPriceEstimate: PriceEstimate = {
    low: 0,
    average: 0,
    high: 0,
    marketValue: 0
  };

  const emptyConfidenceScore: ConfidenceScore = {
    score: 0,
    level: 'medium'
  };

  const initialItemState: Partial<CollectionItem> = {
    userId: user?.id || '',
    category: '',
    name: '',
    type: '',
    manufacturer: '',
    yearProduced: '',
    edition: '',
    modelNumber: '',
    uniqueIdentifiers: '',
    condition: '',
    flaws: '',
    completeness: '',
    acquisitionSource: '',
    previousOwners: '',
    documentation: '',
    images: [],
    videos: [],
    dimensions: '',
    weight: '',
    rarity: '',
    priceEstimate: emptyPriceEstimate,
    confidenceScore: emptyConfidenceScore,
    notes: ''
  };

  const [formData, setFormData] = useState<Partial<CollectionItem>>(initialItemState);
  const [activeTab, setActiveTab] = useState('basic');
  const [aiDescription, setAiDescription] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      const item = getCollection(id);
      if (item) {
        setFormData(item);
      } else {
        navigate('/collection');
      }
    } else {
      // Check if we have data from scan results in sessionStorage
      const editItemDataString = sessionStorage.getItem('editItemData');
      if (editItemDataString) {
        try {
          const editItemData = JSON.parse(editItemDataString);
          setFormData(editItemData);
          
          // If we have notes, add them to the AI description for potential future analysis
          if (editItemData.notes) {
            setAiDescription(editItemData.notes);
          }
          
          // Clear the session storage after we've used it
          sessionStorage.removeItem('editItemData');
          
          toast({
            title: "Data pre-filled",
            description: "Your scanned item data has been loaded into the form",
          });
        } catch (error) {
          console.error("Error parsing session storage data:", error);
        }
      }
    }
  }, [isEditing, id, getCollection, navigate, user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value ? parseFloat(value) : 0;
    
    setFormData(prev => ({
      ...prev,
      priceEstimate: {
        ...prev.priceEstimate!,
        [name]: numValue
      }
    }));
  };

  const handleConfidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'score') {
      const numValue = value ? parseInt(value) : 0;
      const level = numValue >= 80 ? 'high' : numValue >= 50 ? 'medium' : 'low';
      
      setFormData(prev => ({
        ...prev,
        confidenceScore: {
          ...prev.confidenceScore!,
          score: numValue,
          level: level as 'high' | 'medium' | 'low'
        }
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real app, we'd upload these to a server/storage
    // For demo, we'll use local URLs
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...newImages]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };
  
  const handleAiAnalysis = async () => {
    if (!formData.name && !aiDescription) {
      toast({
        title: "Missing information",
        description: "Please provide a name or description to analyze",
        variant: "destructive",
      });
      return;
    }
    
    setIsAiAnalyzing(true);
    
    try {
      const request: AIAnalysisRequest = {
        name: formData.name,
        category: formData.category,
        images: formData.images,
        description: aiDescription
      };
      
      const result = await analyzeItem(request);
      
      setFormData(prev => ({
        ...prev,
        ...result
      }));
      
      toast({
        title: "Analysis complete",
        description: "AI has analyzed your item and updated the form fields",
      });
      
      // Move to the next tab
      setActiveTab('details');
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your item",
        variant: "destructive",
      });
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (!user) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to save items",
          variant: "destructive",
        });
        return;
      }
      
      // Make sure we have the required fields
      if (!formData.name || !formData.category) {
        toast({
          title: "Missing required fields",
          description: "Name and category are required",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      
      const itemData = {
        ...formData,
        userId: user.id
      } as CollectionItem;
      
      if (isEditing && id) {
        const updatedItem = await updateItem(itemData as CollectionItem);
        // Use navigation utility to go back to gallery or item details
        navigateToGallery(navigate, {
          message: `${updatedItem.name} has been updated in your collection`,
          itemId: updatedItem.id
        });
      } else {
        const newItem = await addItem(itemData);
        // Use navigation utility to go to gallery
        navigateToGallery(navigate, {
          message: `${newItem.name} has been added to your collection`,
        });
      }
    } catch (error: any) {
      console.error("Error saving item:", error);
      toast({
        title: "Error saving item",
        description: error.message || "There was an error saving your item",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout title={isEditing ? 'Edit Item' : 'Add New Item'}>
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
        
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="condition">Condition</TabsTrigger>
              <TabsTrigger value="provenance">Provenance</TabsTrigger>
              <TabsTrigger value="value">Value & Rarity</TabsTrigger>
              <TabsTrigger value="media">Images</TabsTrigger>
            </TabsList>
            
            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Item Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name/Title *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter item name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        placeholder="e.g., Coins, Trading Cards, Comics"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer/Creator</Label>
                      <Input
                        id="manufacturer"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleInputChange}
                        placeholder="Who made this item?"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="yearProduced">Year of Production/Issue</Label>
                      <Input
                        id="yearProduced"
                        name="yearProduced"
                        value={formData.yearProduced}
                        onChange={handleInputChange}
                        placeholder="When was this item produced?"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>AI Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="aiDescription">
                        Describe your item (optional for AI analysis)
                      </Label>
                      <Textarea
                        id="aiDescription"
                        value={aiDescription}
                        onChange={(e) => setAiDescription(e.target.value)}
                        placeholder="Provide details about your item to help the AI generate a better description..."
                        rows={5}
                      />
                      <p className="text-xs text-gray-500">
                        AI will analyze your item based on its name, category, and this description. 
                        Adding images can improve the accuracy of the analysis.
                      </p>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={handleAiAnalysis}
                      disabled={isAiAnalyzing}
                      className="w-full"
                    >
                      {isAiAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Analyze with AI
                        </>
                      )}
                    </Button>
                    
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab('details')}
                      >
                        Skip AI Analysis
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        disabled={!formData.name}
                      >
                        Next
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Item Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type/Category</Label>
                      <Input
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        placeholder="Specific type within category"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edition">Edition/Series</Label>
                      <Input
                        id="edition"
                        name="edition"
                        value={formData.edition}
                        onChange={handleInputChange}
                        placeholder="e.g., First Edition, Limited Series"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="modelNumber">Model Number/SKU</Label>
                      <Input
                        id="modelNumber"
                        name="modelNumber"
                        value={formData.modelNumber}
                        onChange={handleInputChange}
                        placeholder="Identifying number if available"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="uniqueIdentifiers">Unique Identifiers</Label>
                      <Input
                        id="uniqueIdentifiers"
                        name="uniqueIdentifiers"
                        value={formData.uniqueIdentifiers}
                        onChange={handleInputChange}
                        placeholder="Serial numbers, marks, signatures, etc."
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        name="dimensions"
                        value={formData.dimensions}
                        onChange={handleInputChange}
                        placeholder="e.g., 10cm x 5cm x 2cm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        placeholder="e.g., 100g, 2.5oz"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes or details about this item"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('basic')}
                    >
                      Previous
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={() => setActiveTab('condition')}
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Condition Tab */}
            <TabsContent value="condition">
              <Card>
                <CardHeader>
                  <CardTitle>Condition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Overall Condition *</Label>
                    <Input
                      id="condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      placeholder="e.g., Mint, Near Mint, Good, Fair, Poor"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="flaws">Specific Flaws/Damage</Label>
                    <Textarea
                      id="flaws"
                      name="flaws"
                      value={formData.flaws}
                      onChange={handleInputChange}
                      placeholder="Describe any flaws, damage, or issues"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="completeness">Completeness</Label>
                    <Input
                      id="completeness"
                      name="completeness"
                      value={formData.completeness}
                      onChange={handleInputChange}
                      placeholder="e.g., Complete, Missing parts, Partially complete"
                    />
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('details')}
                    >
                      Previous
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={() => setActiveTab('provenance')}
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Provenance Tab */}
            <TabsContent value="provenance">
              <Card>
                <CardHeader>
                  <CardTitle>Provenance/History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="acquisitionSource">Source of Acquisition</Label>
                    <Input
                      id="acquisitionSource"
                      name="acquisitionSource"
                      value={formData.acquisitionSource}
                      onChange={handleInputChange}
                      placeholder="Where did you acquire this item?"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="previousOwners">Previous Owners</Label>
                    <Input
                      id="previousOwners"
                      name="previousOwners"
                      value={formData.previousOwners}
                      onChange={handleInputChange}
                      placeholder="List any known previous owners"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="documentation">Documentation</Label>
                    <Textarea
                      id="documentation"
                      name="documentation"
                      value={formData.documentation}
                      onChange={handleInputChange}
                      placeholder="Describe any certificates, receipts, or other documentation"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('condition')}
                    >
                      Previous
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={() => setActiveTab('value')}
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Value & Rarity Tab */}
            <TabsContent value="value">
              <Card>
                <CardHeader>
                  <CardTitle>Value & Rarity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="rarity">Rarity/Scarcity</Label>
                    <Input
                      id="rarity"
                      name="rarity"
                      value={formData.rarity}
                      onChange={handleInputChange}
                      placeholder="e.g., Common, Uncommon, Rare, Very Rare"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Price Estimate (USD)</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="low">Low Estimate</Label>
                        <Input
                          id="low"
                          name="low"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.priceEstimate?.low || 0}
                          onChange={handlePriceChange}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="average">Average Estimate</Label>
                        <Input
                          id="average"
                          name="average"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.priceEstimate?.average || 0}
                          onChange={handlePriceChange}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="high">High Estimate</Label>
                        <Input
                          id="high"
                          name="high"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.priceEstimate?.high || 0}
                          onChange={handlePriceChange}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="marketValue">Market Value</Label>
                        <Input
                          id="marketValue"
                          name="marketValue"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.priceEstimate?.marketValue || 0}
                          onChange={handlePriceChange}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="score">
                      Confidence Score (0-100)
                    </Label>
                    <Input
                      id="score"
                      name="score"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.confidenceScore?.score || 0}
                      onChange={handleConfidenceChange}
                      placeholder="70"
                    />
                    <p className="text-xs text-gray-500">
                      Current confidence level: {formData.confidenceScore?.level || 'medium'}
                    </p>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('provenance')}
                    >
                      Previous
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={() => setActiveTab('media')}
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Media Tab */}
            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="images" className="block mb-2">Upload Images</Label>
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
                  </div>
                  
                  {formData.images && formData.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Uploaded Images</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.images.map((image, index) => (
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
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('value')}
                    >
                      Previous
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          {isEditing ? 'Update Item' : 'Save Item'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </MainLayout>
  );
};

export default AddEditItem;
