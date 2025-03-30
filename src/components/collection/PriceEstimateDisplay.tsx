
import React, { useState } from 'react';
import { PriceEstimate } from '@/types/collection';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { searchItemPrices } from '@/services/collection/priceService';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import ConfidenceBadge from './ConfidenceBadge';

interface PriceEstimateDisplayProps {
  priceEstimate: PriceEstimate;
  showDetails?: boolean;
  itemName?: string;
  itemCategory?: string;
  confidenceScore?: { score: number; level: 'low' | 'medium' | 'high' };
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
  showDetails = false,
  itemName = '',
  itemCategory = '',
  confidenceScore
}) => {
  const [searchResults, setSearchResults] = useState<Array<{ title: string; link: string; price?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [priceRanges, setPriceRanges] = useState<{ 
    low: number | null; 
    average: number | null; 
    high: number | null; 
    count: number;
    confidenceScore?: { score: number; level: 'low' | 'medium' | 'high' };
  } | null>(null);
  const { toast } = useToast();

  const handlePriceSearch = async () => {
    if (!itemName) {
      toast({
        title: "Missing information",
        description: "Item name is required to search for prices",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create a search query using item name and category
      const searchQuery = itemCategory 
        ? `${itemName} ${itemCategory}`
        : itemName;
        
      const result = await searchItemPrices(searchQuery);
      
      if (result.priceRanges) {
        setPriceRanges(result.priceRanges);
      }
      
      if (result.items) {
        setSearchResults(result.items);
      }
      
      if (!result.items || result.items.length === 0) {
        toast({
          title: "No results found",
          description: "No price information found for this item",
        });
      }
    } catch (error) {
      console.error("Error searching for prices:", error);
      toast({
        title: "Search failed",
        description: "Unable to search for price information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (open && searchResults.length === 0 && !isLoading) {
      handlePriceSearch();
    }
  };

  return (
    <div className="space-y-1">
      <div className="font-semibold text-lg">
        {formatCurrency(priceEstimate.marketValue)}
        <span className="text-sm font-normal text-muted-foreground ml-1">
          est. value
        </span>
        
        {confidenceScore && (
          <span className="ml-2">
            <ConfidenceBadge confidenceScore={confidenceScore} />
          </span>
        )}
        
        {itemName && (
          <Sheet open={isSheetOpen} onOpenChange={onSheetOpenChange}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2"
              >
                <Search className="h-4 w-4 mr-1" />
                Compare Prices
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Price Comparison</SheetTitle>
                <SheetDescription>
                  Market prices for {itemName} {itemCategory ? `(${itemCategory})` : ''}
                </SheetDescription>
              </SheetHeader>
              
              {priceRanges && priceRanges.count > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <h4 className="text-sm font-medium mb-2">Price Range Analysis</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Low</p>
                      <p className="font-medium">{priceRanges.low !== null ? formatCurrency(priceRanges.low) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Average</p>
                      <p className="font-medium">{priceRanges.average !== null ? formatCurrency(priceRanges.average) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">High</p>
                      <p className="font-medium">{priceRanges.high !== null ? formatCurrency(priceRanges.high) : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      Based on {priceRanges.count} price points
                    </Badge>
                    
                    {priceRanges.confidenceScore && (
                      <ConfidenceBadge confidenceScore={priceRanges.confidenceScore} />
                    )}
                  </div>
                </div>
              )}
              
              <div className="py-4">
                <h3 className="font-medium text-sm mb-3">Market Listings</h3>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="ml-2">Searching for prices...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {searchResults.map((result, index) => (
                      <div key={index} className="border-b pb-3">
                        <h3 className="font-medium line-clamp-2">{result.title}</h3>
                        {result.price && (
                          <p className="text-sm font-semibold mt-1">{result.price}</p>
                        )}
                        <a 
                          href={result.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center mt-1"
                        >
                          View listing
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No price information found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={handlePriceSearch}
                      disabled={isLoading}
                    >
                      <Search className="h-4 w-4 mr-1" />
                      Search again
                    </Button>
                  </div>
                )}
              </div>
              
              {priceRanges && priceRanges.confidenceScore?.level === 'low' && (
                <div className="mb-4 p-3 border border-yellow-200 bg-yellow-50 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">Low confidence estimate</p>
                    <p>This price estimate may not be accurate due to limited data or inconsistent prices found online. Consider researching further.</p>
                  </div>
                </div>
              )}
              
              <SheetFooter className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePriceSearch}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-1" />
                      Refresh Results
                    </>
                  )}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
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
