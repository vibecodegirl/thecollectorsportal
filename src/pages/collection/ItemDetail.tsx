
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCollection } from '@/contexts/CollectionContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConfidenceBadge from '@/components/collection/ConfidenceBadge';
import PriceEstimateDisplay from '@/components/collection/PriceEstimateDisplay';
import { 
  ArrowLeft, 
  Calendar, 
  Edit, 
  ImageIcon, 
  Info, 
  MoreHorizontal, 
  Ruler, 
  Scale, 
  Trash,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getCollection, deleteItem } = useCollection();
  const navigate = useNavigate();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!id) {
    navigate('/collection');
    return null;
  }
  
  const item = getCollection(id);
  
  if (!item) {
    navigate('/collection');
    return null;
  }
  
  const defaultImage = 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=400&h=300';
  const displayImages = item.images && item.images.length > 0 ? item.images : [defaultImage];
  
  const handleDelete = async () => {
    const success = await deleteItem(id);
    if (success) {
      navigate('/collection');
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/collection')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collection
          </Button>
          <h1 className="text-2xl font-bold flex-grow">{item.name}</h1>
          <div className="flex gap-2">
            <Link to={`/collection/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-500">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete item</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{item.name}" from your collection? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                <img 
                  src={displayImages[currentImageIndex]} 
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {displayImages.length > 1 && (
                <CardFooter className="p-4 flex justify-center">
                  <div className="flex gap-2 overflow-x-auto">
                    {displayImages.map((image, index) => (
                      <button
                        key={index}
                        className={`w-16 h-16 rounded border-2 overflow-hidden ${
                          index === currentImageIndex ? 'border-collector-gold' : 'border-transparent'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img 
                          src={image} 
                          alt={`${item.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </CardFooter>
              )}
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Valuation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Confidence</span>
                  <ConfidenceBadge confidenceScore={item.confidenceScore} />
                </div>
                
                <Separator />
                
                <PriceEstimateDisplay 
                  priceEstimate={item.priceEstimate} 
                  showDetails={true}
                />
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-1">Rarity</h4>
                  <p className="text-gray-700">{item.rarity}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>
                      {item.manufacturer} • {item.yearProduced}
                    </CardDescription>
                  </div>
                  <Badge>{item.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="condition">Condition</TabsTrigger>
                    <TabsTrigger value="provenance">Provenance</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          <Info className="h-4 w-4 inline mr-1" />
                          Type/Category
                        </h3>
                        <p>{item.type}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Year of Production
                        </h3>
                        <p>{item.yearProduced}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Edition/Series
                        </h3>
                        <p>{item.edition || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Model Number/SKU
                        </h3>
                        <p>{item.modelNumber || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Unique Identifiers
                        </h3>
                        <p>{item.uniqueIdentifiers || 'None'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          <Ruler className="h-4 w-4 inline mr-1" />
                          Dimensions
                        </h3>
                        <p>{item.dimensions || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          <Scale className="h-4 w-4 inline mr-1" />
                          Weight
                        </h3>
                        <p>{item.weight || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Added to Collection
                        </h3>
                        <p>{formatDate(item.dateAdded)}</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="condition" className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Overall Condition</h3>
                      <p className="text-gray-700">{item.condition}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-1">Specific Flaws/Damage</h3>
                      <p className="text-gray-700">{item.flaws || 'None noted'}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-1">Completeness</h3>
                      <p className="text-gray-700">{item.completeness}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="provenance" className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Source of Acquisition</h3>
                      <p className="text-gray-700">{item.acquisitionSource || 'Not specified'}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-1">Previous Owners</h3>
                      <p className="text-gray-700">{item.previousOwners || 'Not known'}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-1">Documentation</h3>
                      <p className="text-gray-700">{item.documentation || 'None available'}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="notes">
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      <div className="text-gray-700">
                        {item.notes || 'No additional notes for this item.'}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {item.images && item.images.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    All Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {item.images.map((image, index) => (
                      <div 
                        key={index} 
                        className="aspect-square rounded-md overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img 
                          src={image} 
                          alt={`${item.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ItemDetail;
