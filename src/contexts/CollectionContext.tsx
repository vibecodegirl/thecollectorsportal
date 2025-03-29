import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  CollectionItem, 
  ConfidenceScore, 
  PriceEstimate 
} from '../types/collection';
import { supabase } from '@/integrations/supabase/client';
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

export interface AIAnalysisRequest {
  images?: string[];
  category?: string;
  description?: string;
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
      const { data, error } = await supabase
        .from('collection_items')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      const transformedData = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        dateAdded: item.created_at,
        lastUpdated: item.updated_at,
        name: item.name,
        category: item.category || '',
        type: item.type || '',
        manufacturer: item.manufacturer || '',
        yearProduced: item.year_produced || '',
        edition: item.edition || '',
        modelNumber: item.model_number || '',
        uniqueIdentifiers: item.unique_identifiers || '',
        condition: item.condition || '',
        flaws: item.flaws || '',
        completeness: item.completeness || '',
        acquisitionSource: item.acquisition_source || '',
        previousOwners: item.previous_owners || '',
        documentation: item.documentation || '',
        images: item.image_url ? [item.image_url] : [],
        videos: [],
        dimensions: item.dimensions || '',
        weight: item.weight || '',
        rarity: item.rarity || '',
        priceEstimate: {
          low: item.estimated_value || 0,
          average: item.estimated_value || 0,
          high: item.estimated_value || 0,
          marketValue: item.estimated_value || 0
        },
        confidenceScore: {
          score: 50,
          level: 'medium' as 'low' | 'medium' | 'high'
        },
        notes: item.description || ''
      }));
      
      setCollections(transformedData);
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
      
      const supabaseItem = {
        user_id: user.id,
        name: item.name,
        description: item.notes,
        category: item.category,
        condition: item.condition,
        estimated_value: item.priceEstimate?.marketValue || 0,
        image_url: item.images && item.images.length > 0 ? item.images[0] : null,
        acquisition_date: null,
        type: item.type,
        manufacturer: item.manufacturer,
        year_produced: item.yearProduced,
        edition: item.edition,
        model_number: item.modelNumber,
        unique_identifiers: item.uniqueIdentifiers,
        flaws: item.flaws,
        completeness: item.completeness,
        acquisition_source: item.acquisitionSource,
        previous_owners: item.previousOwners,
        documentation: item.documentation,
        dimensions: item.dimensions,
        weight: item.weight,
        rarity: item.rarity
      };

      const { data, error } = await supabase
        .from('collection_items')
        .insert(supabaseItem)
        .select()
        .single();

      if (error) throw error;

      const newItem: CollectionItem = {
        id: data.id,
        userId: data.user_id,
        dateAdded: data.created_at,
        lastUpdated: data.updated_at,
        name: data.name,
        category: data.category || '',
        type: data.type || '',
        manufacturer: data.manufacturer || '',
        yearProduced: data.year_produced || '',
        edition: data.edition || '',
        modelNumber: data.model_number || '',
        uniqueIdentifiers: data.unique_identifiers || '',
        condition: data.condition || '',
        flaws: data.flaws || '',
        completeness: data.completeness || '',
        acquisitionSource: data.acquisition_source || '',
        previousOwners: data.previous_owners || '',
        documentation: data.documentation || '',
        images: data.image_url ? [data.image_url] : [],
        videos: [],
        dimensions: data.dimensions || '',
        weight: data.weight || '',
        rarity: data.rarity || '',
        priceEstimate: {
          low: data.estimated_value || 0,
          average: data.estimated_value || 0,
          high: data.estimated_value || 0,
          marketValue: data.estimated_value || 0
        },
        confidenceScore: {
          score: 50,
          level: 'medium' as 'low' | 'medium' | 'high'
        },
        notes: data.description || ''
      };

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
      
      const supabaseItem = {
        name: item.name,
        description: item.notes,
        category: item.category,
        condition: item.condition,
        estimated_value: item.priceEstimate?.marketValue || 0,
        image_url: item.images && item.images.length > 0 ? item.images[0] : null,
        type: item.type,
        manufacturer: item.manufacturer,
        year_produced: item.yearProduced,
        edition: item.edition,
        model_number: item.modelNumber,
        unique_identifiers: item.uniqueIdentifiers,
        flaws: item.flaws,
        completeness: item.completeness,
        acquisition_source: item.acquisitionSource,
        previous_owners: item.previousOwners,
        documentation: item.documentation,
        dimensions: item.dimensions,
        weight: item.weight,
        rarity: item.rarity
      };

      const { data, error } = await supabase
        .from('collection_items')
        .update(supabaseItem)
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;

      const updatedItem: CollectionItem = {
        id: data.id,
        userId: data.user_id,
        dateAdded: data.created_at,
        lastUpdated: data.updated_at,
        name: data.name,
        category: data.category || '',
        type: data.type || '',
        manufacturer: data.manufacturer || '',
        yearProduced: data.year_produced || '',
        edition: data.edition || '',
        modelNumber: data.model_number || '',
        uniqueIdentifiers: data.unique_identifiers || '',
        condition: data.condition || '',
        flaws: data.flaws || '',
        completeness: data.completeness || '',
        acquisitionSource: data.acquisition_source || '',
        previousOwners: data.previous_owners || '',
        documentation: data.documentation || '',
        images: data.image_url ? [data.image_url] : [],
        videos: [],
        dimensions: data.dimensions || '',
        weight: data.weight || '',
        rarity: data.rarity || '',
        priceEstimate: {
          low: data.estimated_value || 0,
          average: data.estimated_value || 0,
          high: data.estimated_value || 0,
          marketValue: data.estimated_value || 0
        },
        confidenceScore: {
          score: 50,
          level: 'medium' as 'low' | 'medium' | 'high'
        },
        notes: data.description || ''
      };

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
      
      const { error } = await supabase
        .from('collection_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

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
      
      return {
        category: request.category || "Unknown",
        name: "Analyzed Item",
        type: "Unknown",
        manufacturer: "Unknown",
        yearProduced: "Unknown",
        edition: "Standard",
        modelNumber: "Unknown",
        uniqueIdentifiers: "",
        condition: "Good",
        flaws: "",
        completeness: "Complete",
        dimensions: "",
        weight: "",
        rarity: "Common",
        priceEstimate: {
          low: 10,
          average: 20,
          high: 30,
          marketValue: 20
        },
        confidenceScore: {
          score: 50,
          level: 'medium'
        },
        notes: request.description || "",
      };
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
