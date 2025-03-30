
import { useNavigate } from 'react-router-dom';

/**
 * Creates a function to navigate to the collection gallery with optional filters
 * @returns A function that navigates to the gallery with optional parameters
 */
export const useGalleryNavigation = () => {
  const navigate = useNavigate();
  
  return (options?: {
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
    
    navigate(path);
  };
};

/**
 * Direct navigation function for non-component contexts
 * Uses window.location for environments where hooks cannot be used
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
  
  // For non-component contexts where useNavigate cannot be used
  window.location.href = path;
};
