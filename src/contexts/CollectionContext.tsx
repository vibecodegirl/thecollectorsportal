
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CollectionItem } from '../types/collection';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchCollectionItems,
  addCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
  analyzeCollectionItem
} from '@/services/collectionService';

interface CollectionContextType {
  collections: CollectionItem[];
  loading: boolean;
  getCollection: (id: string) => CollectionItem | undefined;
  addItem: (item: Omit<CollectionItem, 'id' | 'dateAdded' | 'lastUpdated'>) => Promise<CollectionItem>;
  updateItem: (item: CollectionItem) => Promise<CollectionItem>;
  deleteItem: (itemId: string) => Promise<boolean>;
  analyzeItem: (request: AIAnalysisRequest) => Promise<Partial<CollectionItem>>;
  refreshCollections: () => void;
}

export interface AIAnalysisRequest {
  images?: string[];
  category?: string;
  description?: string;
  name?: string;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export const CollectionProvider = ({ children }: { children: ReactNode }) => {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadCollections();
    } else {
      setCollections([]);
      setLoading(false);
    }
  }, [user]);

  const loadCollections = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const items = await fetchCollectionItems(user.id);
      setCollections(items);
    } catch (error: any) {
      toast({
        title: "Error loading collections",
        description: error.message || "Failed to load your collection items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshCollections = () => {
    loadCollections();
  };

  const getCollection = (id: string) => {
    return collections.find(item => item.id === id);
  };

  const addItem = async (item: Omit<CollectionItem, 'id' | 'dateAdded' | 'lastUpdated'>) => {
    try {
      if (!user) throw new Error('User must be logged in to add items');
      
      const newItem = await addCollectionItem(item, user.id);
      setCollections(prev => [...prev, newItem]);
      
      toast({
        title: "Item added",
        description: `${newItem.name} has been added to your collection`,
      });
      
      return newItem;
    } catch (error: any) {
      toast({
        title: "Error adding item",
        description: error.message || "Failed to add new item to your collection",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateItem = async (item: CollectionItem) => {
    try {
      if (!user) throw new Error('User must be logged in to update items');
      
      const updatedItem = await updateCollectionItem(item);
      
      setCollections(prev => 
        prev.map(i => i.id === updatedItem.id ? updatedItem : i)
      );
      
      toast({
        title: "Item updated",
        description: `${updatedItem.name} has been updated`,
      });
      
      return updatedItem;
    } catch (error: any) {
      toast({
        title: "Error updating item",
        description: error.message || "Failed to update the item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      if (!user) throw new Error('User must be logged in to delete items');
      
      await deleteCollectionItem(itemId);
      setCollections(prev => prev.filter(i => i.id !== itemId));
      
      toast({
        title: "Item deleted",
        description: "The item has been removed from your collection",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message || "Failed to delete the item",
        variant: "destructive",
      });
      return false;
    }
  };

  const analyzeItem = async (request: AIAnalysisRequest) => {
    try {
      toast({
        title: "Analyzing item",
        description: "Our AI is analyzing your item...",
      });
      
      const result = await analyzeCollectionItem(request);
      
      toast({
        title: "Analysis complete",
        description: "Your item has been analyzed successfully",
      });
      
      return result;
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze the item",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <CollectionContext.Provider 
      value={{ 
        collections, 
        loading, 
        getCollection, 
        addItem, 
        updateItem, 
        deleteItem,
        analyzeItem,
        refreshCollections
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return context;
};
