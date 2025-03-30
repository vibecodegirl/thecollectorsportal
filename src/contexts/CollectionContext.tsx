
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CollectionItem, ItemStatus, SaleInfo } from '../types/collection';
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
  addItem: (item: Omit<CollectionItem, 'id' | 'dateAdded' | 'lastUpdated' | 'status'>) => Promise<CollectionItem>;
  updateItem: (item: CollectionItem) => Promise<CollectionItem>;
  deleteItem: (itemId: string) => Promise<boolean>;
  archiveItem: (itemId: string) => Promise<CollectionItem>;
  markItemAsSold: (itemId: string, saleInfo: SaleInfo) => Promise<CollectionItem>;
  analyzeItem: (request: AIAnalysisRequest) => Promise<Partial<CollectionItem>>;
  refreshCollections: () => void;
  filteredCollections: (status?: ItemStatus) => CollectionItem[];
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
      // Ensure all items have a status field (for backward compatibility)
      const itemsWithStatus = items.map(item => ({
        ...item,
        status: item.status || 'active' as ItemStatus
      }));
      setCollections(itemsWithStatus);
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

  const addItem = async (item: Omit<CollectionItem, 'id' | 'dateAdded' | 'lastUpdated' | 'status'>) => {
    try {
      if (!user) throw new Error('User must be logged in to add items');
      
      // Set default status to active
      const itemWithStatus = {
        ...item,
        status: 'active' as ItemStatus
      };
      
      const newItem = await addCollectionItem(itemWithStatus, user.id);
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
      
      // Verify the item was removed from the database before updating the state
      setCollections(prev => {
        const filteredItems = prev.filter(i => i.id !== itemId);
        if (filteredItems.length === prev.length) {
          throw new Error("Item could not be deleted. It may no longer exist.");
        }
        return filteredItems;
      });
      
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
      throw error;
    }
  };
  
  const archiveItem = async (itemId: string) => {
    try {
      const item = getCollection(itemId);
      if (!item) throw new Error('Item not found');
      
      const updatedItem = {
        ...item,
        status: 'archived' as ItemStatus,
        lastUpdated: new Date().toISOString()
      };
      
      return await updateItem(updatedItem);
    } catch (error: any) {
      toast({
        title: "Error archiving item",
        description: error.message || "Failed to archive the item",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const markItemAsSold = async (itemId: string, saleInfo: SaleInfo) => {
    try {
      const item = getCollection(itemId);
      if (!item) throw new Error('Item not found');
      
      const updatedItem = {
        ...item,
        status: 'sold' as ItemStatus,
        saleInfo: {
          ...item.saleInfo,
          ...saleInfo,
          saleDate: saleInfo.saleDate || new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      };
      
      return await updateItem(updatedItem);
    } catch (error: any) {
      toast({
        title: "Error marking item as sold",
        description: error.message || "Failed to mark the item as sold",
        variant: "destructive",
      });
      throw error;
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
  
  const filteredCollections = (status?: ItemStatus) => {
    if (!status) return collections;
    return collections.filter(item => item.status === status);
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
        archiveItem,
        markItemAsSold,
        analyzeItem,
        refreshCollections,
        filteredCollections
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
