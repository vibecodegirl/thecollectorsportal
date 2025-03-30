
import { NavigateFunction } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

/**
 * Navigates to the collection gallery with a success message
 */
export const navigateToGallery = (
  navigate: NavigateFunction, 
  options?: {
    message?: string;
    delay?: number;
    itemId?: string;
  }
) => {
  const { message, delay = 0, itemId } = options || {};
  
  if (message) {
    toast({
      title: "Success",
      description: message,
    });
  }
  
  // If delay is provided, wait before navigating
  if (delay > 0) {
    setTimeout(() => {
      navigate(itemId ? `/collection/${itemId}` : '/collection');
    }, delay);
  } else {
    navigate(itemId ? `/collection/${itemId}` : '/collection');
  }
};
