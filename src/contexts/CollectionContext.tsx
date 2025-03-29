
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  CollectionItem, 
  ConfidenceScore, 
  PriceEstimate 
} from '../types/collection';
import { 
  getUserCollections, 
  addCollectionItem, 
  updateCollectionItem,
  deleteCollectionItem,
  generateAIDescription,
  AIAnalysisRequest 
} from '../lib/mock-data';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

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

  const loadCollections = () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userCollections = getUserCollections(user.id);
      setCollections(userCollections);
    } catch (error) {
      toast({
        title: "Error loading collections",
        description: "Failed to load your collection items",
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
      const newItem = addCollectionItem(item);
      setCollections(prev => [...prev, newItem]);
      toast({
        title: "Item added",
        description: `${newItem.name} has been added to your collection`,
      });
      return newItem;
    } catch (error) {
      toast({
        title: "Error adding item",
        description: "Failed to add new item to your collection",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateItem = async (item: CollectionItem) => {
    try {
      const updatedItem = updateCollectionItem(item);
      setCollections(prev => 
        prev.map(i => i.id === updatedItem.id ? updatedItem : i)
      );
      toast({
        title: "Item updated",
        description: `${updatedItem.name} has been updated`,
      });
      return updatedItem;
    } catch (error) {
      toast({
        title: "Error updating item",
        description: "Failed to update the item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const success = deleteCollectionItem(itemId);
      if (success) {
        setCollections(prev => prev.filter(i => i.id !== itemId));
        toast({
          title: "Item deleted",
          description: "The item has been removed from your collection",
        });
      }
      return success;
    } catch (error) {
      toast({
        title: "Error deleting item",
        description: "Failed to delete the item",
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
      
      const aiResponse = await generateAIDescription(request);
      
      return {
        category: aiResponse.category,
        name: aiResponse.name,
        type: aiResponse.type,
        manufacturer: aiResponse.manufacturer,
        yearProduced: aiResponse.yearProduced,
        edition: aiResponse.edition,
        modelNumber: aiResponse.modelNumber,
        uniqueIdentifiers: aiResponse.uniqueIdentifiers,
        condition: aiResponse.condition,
        flaws: aiResponse.flaws,
        completeness: aiResponse.completeness,
        dimensions: aiResponse.dimensions,
        weight: aiResponse.weight,
        rarity: aiResponse.rarity,
        priceEstimate: aiResponse.priceEstimate,
        confidenceScore: aiResponse.confidenceScore,
        notes: aiResponse.notes,
      };
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the item",
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
