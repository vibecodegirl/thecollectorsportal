
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CollectionItem } from '@/types/collection';
import ConfidenceBadge from './ConfidenceBadge';
import PriceEstimateDisplay from './PriceEstimateDisplay';
import CollectionItemImage from './CollectionItemImage';
import CollectionItemActions from './CollectionItemActions';

interface CollectionItemCardProps {
  item: CollectionItem;
}

const CollectionItemCard: React.FC<CollectionItemCardProps> = ({ item }) => {
  const defaultImage = 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=400&h=300';
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : defaultImage;
  
  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <CollectionItemImage 
        imageUrl={imageUrl} 
        itemName={item.name} 
        category={item.category}
        confidenceScore={item.confidenceScore}
        condition={item.condition}
      />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {item.manufacturer ? item.manufacturer : 'Unknown manufacturer'} • {item.yearProduced ? item.yearProduced : 'Unknown year'}
        </p>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        {item.type && (
          <Badge variant="outline" className="mb-2">
            {item.type}
          </Badge>
        )}
        
        <div className="mt-2">
          <PriceEstimateDisplay 
            priceEstimate={item.priceEstimate} 
            itemName={item.name}
            itemCategory={item.category}
          />
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 border-t flex justify-between">
        <CollectionItemActions itemId={item.id} itemName={item.name} />
      </CardFooter>
    </Card>
  );
};

export default CollectionItemCard;
