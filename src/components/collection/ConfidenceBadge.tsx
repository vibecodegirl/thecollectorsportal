
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ConfidenceScore } from '@/types/collection';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConfidenceBadgeProps {
  confidenceScore: ConfidenceScore;
  showDetails?: boolean;
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ 
  confidenceScore,
  showDetails = false
}) => {
  const getVariant = () => {
    switch (confidenceScore.level) {
      case 'high':
        return 'outline';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!showDetails || !confidenceScore.factors) {
    return (
      <Badge variant={getVariant()}>
        Confidence: {confidenceScore.score}% ({confidenceScore.level})
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Badge variant={getVariant()} className="cursor-help">
              Confidence: {confidenceScore.score}% ({confidenceScore.level})
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-2">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Confidence Score Factors:</h4>
            <ul className="text-xs space-y-1">
              {confidenceScore.factors.map((factor, index) => (
                <li key={index} className="flex justify-between">
                  <span>{factor.factor}:</span>
                  <span className="font-medium">+{factor.impact}</span>
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConfidenceBadge;
