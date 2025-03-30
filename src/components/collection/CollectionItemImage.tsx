
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CollectionItemImageProps {
  imageUrl: string;
  itemName: string;
  category?: string;
  confidenceScore?: { score: number; level: 'low' | 'medium' | 'high' };
  condition?: string;
  rarity?: string;
  material?: string;
  primaryObjectData?: {
    shape?: string;
    colors?: {
      dominant?: string;
      accents?: string | string[];
    };
  };
}

const CollectionItemImage: React.FC<CollectionItemImageProps> = ({ 
  imageUrl, 
  itemName, 
  category,
  confidenceScore,
  condition,
  rarity,
  material,
  primaryObjectData
}) => {
  return (
    <div className="relative h-48 overflow-hidden group">
      <img 
        src={imageUrl} 
        alt={itemName}
        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
      />
      
      {/* Overlay gradient at the top for better badge visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Category badge */}
      {category && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/80 dark:bg-black/50 backdrop-blur-sm">
            {category}
          </Badge>
        </div>
      )}
      
      {/* Status badges - shown on hover */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-1">
        {condition && (
          <Badge variant="outline" className="bg-white/80 dark:bg-black/50 backdrop-blur-sm text-xs">
            {condition}
          </Badge>
        )}
        
        {rarity && (
          <Badge 
            className={`text-xs ${
              rarity === 'Rare' 
                ? 'bg-purple-500/80' 
                : rarity === 'Uncommon' 
                ? 'bg-blue-500/80' 
                : 'bg-gray-500/80'
            } text-white backdrop-blur-sm`}
          >
            {rarity}
          </Badge>
        )}
        
        {confidenceScore && (
          <Badge 
            className={`text-xs ${
              confidenceScore.level === 'high' 
                ? 'bg-green-500/80' 
                : confidenceScore.level === 'medium' 
                ? 'bg-yellow-500/80' 
                : 'bg-red-500/80'
            } text-white backdrop-blur-sm`}
          >
            {confidenceScore.score}% confidence
          </Badge>
        )}
      </div>
      
      {/* Material and color info on bottom */}
      {(material || primaryObjectData?.colors?.dominant) && (
        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/50 text-white text-xs py-1 px-2 backdrop-blur-sm">
            {material && <span className="mr-2">{material}</span>}
            {primaryObjectData?.colors?.dominant && (
              <span>{primaryObjectData.colors.dominant}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionItemImage;
