
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ConfidenceScore } from '@/types/collection';

interface ConfidenceBadgeProps {
  confidenceScore: ConfidenceScore;
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidenceScore }) => {
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

  return (
    <Badge variant={getVariant()}>
      Confidence: {confidenceScore.score}% ({confidenceScore.level})
    </Badge>
  );
};

export default ConfidenceBadge;
