
import React, { useState } from 'react';
import { PriceEstimate } from '@/types/collection';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { searchItemPrices } from '@/services/collectionService';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface PriceEstimateDisplayProps {
  priceEstimate: PriceEstimate;
  showDetails?: boolean;
  itemName?: string;
  itemCategory?: string;
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
  itemCategory = ''
}) => {
  const [searchResults, setSearchResults] = useState<Array<{ title: string; link: string; price?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
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
        
      const results = await searchItemPrices(searchQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
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

  return (
    <div className="space-y-1">
      <div className="font-semibold text-lg">
        {formatCurrency(priceEstimate.marketValue)}
        <span className="text-sm font-normal text-muted-foreground ml-1">
          est. value
        </span>
        
        {itemName && (
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2" 
                onClick={(e) => {
                  e.preventDefault();
                  if (searchResults.length === 0) {
                    handlePriceSearch();
                  }
                }}
              >
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Price Comparison</SheetTitle>
                <SheetDescription>
                  Market prices for similar items
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4">
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Searching for prices...</p>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div key={index} className="border-b pb-3">
                        <h3 className="font-medium line-clamp-2">{result.title}</h3>
                        {result.price && (
                          <p className="text-sm font-semibold">{result.price}</p>
                        )}
                        <a 
                          href={result.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View item
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
