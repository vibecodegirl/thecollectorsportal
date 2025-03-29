
import React from 'react';
import { PriceEstimate } from '@/types/collection';

interface PriceEstimateDisplayProps {
  priceEstimate: PriceEstimate;
  showDetails?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PriceEstimateDisplay: React.FC<PriceEstimateDisplayProps> = ({ 
  priceEstimate, 
  showDetails = false 
}) => {
  return (
    <div className="space-y-1">
      <div className="font-semibold text-lg">
        {formatCurrency(priceEstimate.marketValue)}
        <span className="text-sm font-normal text-muted-foreground ml-1">
          est. value
        </span>
      </div>
      
      {showDetails && (
        <div className="text-sm text-muted-foreground">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="block">Low</span>
              <span>{formatCurrency(priceEstimate.low)}</span>
            </div>
            <div>
              <span className="block">Average</span>
              <span>{formatCurrency(priceEstimate.average)}</span>
            </div>
            <div>
              <span className="block">High</span>
              <span>{formatCurrency(priceEstimate.high)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceEstimateDisplay;
