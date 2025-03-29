
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CollectionItem } from '@/types/collection';
import { Edit, Eye } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';
import PriceEstimateDisplay from './PriceEstimateDisplay';

interface CollectionItemCardProps {
  item: CollectionItem;
}

const CollectionItemCard: React.FC<CollectionItemCardProps> = ({ item }) => {
  const defaultImage = 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=400&h=300';
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : defaultImage;
  
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
      </CardFooter>
    </Card>
  );
};

export default CollectionItemCard;
