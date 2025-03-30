
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CollectionItem } from '@/types/collection';
import { Edit, Eye, Trash, Archive } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';
import PriceEstimateDisplay from './PriceEstimateDisplay';
import { useCollection } from '@/contexts/CollectionContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

interface CollectionItemCardProps {
  item: CollectionItem;
}

const CollectionItemCard: React.FC<CollectionItemCardProps> = ({ item }) => {
  const defaultImage = 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=400&h=300';
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : defaultImage;
  const { deleteItem, archiveItem } = useCollection();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  
  const handleDelete = async () => {
    try {
      await deleteItem(item.id);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleArchive = async () => {
    try {
      await archiveItem(item.id);
    } catch (error) {
      console.error('Error archiving item:', error);
    }
  };
  
  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={item.name}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/80 dark:bg-black/50 backdrop-blur-sm">
            {item.category}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {item.manufacturer} • {item.yearProduced}
        </p>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <div className="flex justify-between items-center mb-2">
          <ConfidenceBadge confidenceScore={item.confidenceScore} />
          <Badge variant="outline">{item.condition}</Badge>
        </div>
        
        <div className="mt-2">
          <PriceEstimateDisplay priceEstimate={item.priceEstimate} />
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 border-t flex justify-between">
        <div className="flex gap-1">
          <Link to={`/collection/${item.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="mr-1 h-4 w-4" />
              View
            </Button>
          </Link>
          <Link to={`/collection/${item.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
        <div className="flex gap-1">
          <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Archive className="mr-1 h-4 w-4" />
                Archive
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to archive "{item.name}"? It will be moved to your archives.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-500">
                <Trash className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{item.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CollectionItemCard;
