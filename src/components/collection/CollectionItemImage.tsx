
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CollectionItemImageProps {
  imageUrl: string;
  itemName: string;
  category?: string;
}

const CollectionItemImage: React.FC<CollectionItemImageProps> = ({ imageUrl, itemName, category }) => {
  return (
    <div className="relative h-48 overflow-hidden">
      <img 
        src={imageUrl} 
        alt={itemName}
        className="w-full h-full object-cover transition-transform hover:scale-105"
      />
      {category && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/80 dark:bg-black/50 backdrop-blur-sm">
            {category}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default CollectionItemImage;
