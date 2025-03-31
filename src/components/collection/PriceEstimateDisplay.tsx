
import React, { useState } from 'react';
import { PriceEstimate } from '@/types/collection';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ExternalLink, AlertCircle, Info, TrendingUp, DollarSign } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from '@/components/ui/card';

interface PriceEstimateDisplayProps {
  priceEstimate: PriceEstimate;
  showDetails?: boolean;
  itemName?: string;
  itemCategory?: string;
  confidenceScore?: { 
    score: number; 
    level: 'low' | 'medium' | 'high';
    factors?: {factor: string, impact: number}[];
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const PriceEstimateDisplay: React.FC<PriceEstimateDisplayProps> = ({ 
  priceEstimate, 
  showDetails = false,
  itemName = '',
  itemCategory = '',
  confidenceScore
}) => {
  const [searchResults, setSearchResults] = useState<Array<{ title: string; link: string; price?: string; source?: string; }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [priceRanges, setPriceRanges] = useState<{ 
    low: number | null; 
    average: number | null; 
    high: number | null; 
    median?: number | null;
    count: number;
    filteredCount?: number;
    lastUpdated?: Date;
    histogramData?: {
      buckets: {min: number, max: number, count: number}[], 
      range: {min: number, max: number}
    };
    confidenceScore?: { 
      score: number; 
      level: 'low' | 'medium' | 'high';
      factors?: {factor: string, impact: number}[];
    };
    tukeysLimits?: {
      lower: number | null;
      upper: number | null;
    };
    percentiles?: {
      p10: number | null;
      p25: number | null;
      p50: number | null;
      p75: number | null;
      p90: number | null;
    };
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
  
  // Simple price distribution chart using bars
  const PriceDistributionChart = ({ histogramData }) => {
    if (!histogramData || !histogramData.buckets || histogramData.buckets.length === 0) {
      return null;
    }
    
    const maxCount = Math.max(...histogramData.buckets.map(b => b.count));
    
    return (
      <div className="mt-2">
        <h5 className="text-xs font-medium mb-1 text-muted-foreground">Price Distribution</h5>
        <div className="flex items-end h-20 gap-1">
          {histogramData.buckets.map((bucket, index) => {
            const heightPercent = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-collector-purple rounded-t w-full" 
                  style={{ 
                    height: `${heightPercent}%`,
                    minHeight: bucket.count > 0 ? '4px' : '0'
                  }}
                  title={`${bucket.min} - ${bucket.max}: ${bucket.count} items`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs">{formatCurrency(histogramData.range.min)}</span>
          <span className="text-xs">{formatCurrency(histogramData.range.max)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="font-semibold text-lg flex items-center flex-wrap">
        {formatCurrency(priceEstimate.marketValue)}
        <span className="text-sm font-normal text-muted-foreground ml-1">
          est. value
        </span>
        
        {confidenceScore && (
          <span className="ml-2">
            <ConfidenceBadge confidenceScore={confidenceScore} showDetails={true} />
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
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Price Comparison</SheetTitle>
                <SheetDescription>
                  Market prices for {itemName} {itemCategory ? `(${itemCategory})` : ''}
                </SheetDescription>
              </SheetHeader>
              
              {priceRanges && priceRanges.count > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Price Analysis</h4>
                    {priceRanges.lastUpdated && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Info className="h-3 w-3 mr-1" />
                              Updated {new Date(priceRanges.lastUpdated).toLocaleString()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Last price check time</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  
                  {/* Price distribution chart */}
                  {priceRanges.histogramData && (
                    <PriceDistributionChart histogramData={priceRanges.histogramData} />
                  )}
                  
                  <div className="grid grid-cols-3 gap-3 text-center mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Low</p>
                      <p className="font-medium">{priceRanges.low !== null ? formatCurrency(priceRanges.low) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {priceRanges.median !== null ? 'Median' : 'Average'}
                      </p>
                      <p className="font-medium">
                        {priceRanges.median !== null 
                          ? formatCurrency(priceRanges.median) 
                          : priceRanges.average !== null 
                            ? formatCurrency(priceRanges.average) 
                            : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">High</p>
                      <p className="font-medium">{priceRanges.high !== null ? formatCurrency(priceRanges.high) : 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Percentiles if available */}
                  {priceRanges.percentiles && priceRanges.count >= 5 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="text-xs font-medium mb-2">Percentiles</h5>
                      <div className="grid grid-cols-5 gap-1 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">10%</p>
                          <p className="text-xs">{priceRanges.percentiles.p10 !== null ? formatCurrency(priceRanges.percentiles.p10) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">25%</p>
                          <p className="text-xs">{priceRanges.percentiles.p25 !== null ? formatCurrency(priceRanges.percentiles.p25) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">50%</p>
                          <p className="text-xs">{priceRanges.percentiles.p50 !== null ? formatCurrency(priceRanges.percentiles.p50) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">75%</p>
                          <p className="text-xs">{priceRanges.percentiles.p75 !== null ? formatCurrency(priceRanges.percentiles.p75) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">90%</p>
                          <p className="text-xs">{priceRanges.percentiles.p90 !== null ? formatCurrency(priceRanges.percentiles.p90) : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      Based on {priceRanges.count} price points
                      {priceRanges.filteredCount !== undefined && priceRanges.filteredCount !== priceRanges.count && (
                        <> ({priceRanges.filteredCount} after filtering)</>
                      )}
                    </Badge>
                    
                    {priceRanges.confidenceScore && (
                      <ConfidenceBadge confidenceScore={priceRanges.confidenceScore} showDetails={true} />
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
                        <div className="flex justify-between items-center mt-1">
                          {result.price && (
                            <p className="text-sm font-semibold">{result.price}</p>
                          )}
                          {result.source && (
                            <Badge variant="outline" className="text-xs">
                              {result.source}
                            </Badge>
                          )}
                        </div>
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
