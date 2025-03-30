
import { navigate as routerNavigate } from 'react-router-dom';

/**
 * Navigates to the collection gallery with optional filters
 * @param options Navigation options
 */
export const navigateToGallery = (options?: {
  filter?: 'active' | 'archived' | 'sold' | 'all';
  category?: string;
  search?: string;
}) => {
  let path = '/collection';
  
  if (options) {
    const params = new URLSearchParams();
    
    if (options.filter) {
      params.append('status', options.filter);
    }
    
    if (options.category) {
      params.append('category', options.category);
    }
    
    if (options.search) {
      params.append('search', options.search);
    }
    
    const queryString = params.toString();
    if (queryString) {
      path += `?${queryString}`;
    }
  }
  
  routerNavigate(path);
};
