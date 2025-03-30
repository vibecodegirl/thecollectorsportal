import { supabase } from "@/integrations/supabase/client";
import { CollectionItem } from "@/types/collection";
import { transformDatabaseItemToCollectionItem, transformCollectionItemToDatabase } from "@/utils/collectionTransformers";

/**
 * Get all collection items for a user
 */
export const getCollectionItems = async (userId: string): Promise<CollectionItem[]> => {
  try {
    const { data, error } = await supabase
      .from("collection_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching collection items", error);
      throw new Error(error.message);
    }

    return data.map(transformDatabaseItemToCollectionItem);
  } catch (error: any) {
    console.error("Error in getCollectionItems:", error);
    throw new Error(`Failed to fetch items: ${error.message}`);
  }
};

/**
 * Get a single collection item by ID
 */
export const getCollectionItemById = async (
  itemId: string,
  userId: string
): Promise<CollectionItem | null> => {
  try {
    const { data, error } = await supabase
      .from("collection_items")
      .select("*")
      .eq("id", itemId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No data found
      }
      console.error("Error fetching collection item", error);
      throw new Error(error.message);
    }

    return transformDatabaseItemToCollectionItem(data);
  } catch (error: any) {
    console.error("Error in getCollectionItemById:", error);
    throw new Error(`Failed to fetch item: ${error.message}`);
  }
};

/**
 * Create a new collection item
 */
export const createCollectionItem = async (
  item: Partial<CollectionItem>,
  userId: string
): Promise<CollectionItem> => {
  try {
    // Transform to database structure, only keeping fields that exist in the database
    const dbItem = transformCollectionItemToDatabase(item, userId);
    
    console.log("Creating collection item with data:", dbItem);

    const { data, error } = await supabase
      .from("collection_items")
      .insert(dbItem)
      .select()
      .single();

    if (error) {
      console.error("Error creating collection item", error);
      throw new Error(error.message);
    }

    return transformDatabaseItemToCollectionItem(data);
  } catch (error: any) {
    console.error("Error in createCollectionItem:", error);
    throw new Error(`Failed to create item: ${error.message}`);
  }
};

/**
 * Update an existing collection item
 */
export const updateCollectionItem = async (
  id: string,
  item: Partial<CollectionItem>,
  userId: string
): Promise<CollectionItem> => {
  try {
    // Transform to database structure, only keeping fields that exist in the database
    const dbItem = transformCollectionItemToDatabase({ ...item, id }, userId);
    
    console.log("Updating collection item with data:", dbItem);

    const { data, error } = await supabase
      .from("collection_items")
      .update(dbItem)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating collection item", error);
      throw new Error(error.message);
    }

    return transformDatabaseItemToCollectionItem(data);
  } catch (error: any) {
    console.error("Error in updateCollectionItem:", error);
    throw new Error(`Failed to update item: ${error.message}`);
  }
};

/**
 * Delete a collection item
 */
export const deleteCollectionItem = async (
  id: string,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting collection item", error);
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error("Error in deleteCollectionItem:", error);
    throw new Error(`Failed to delete item: ${error.message}`);
  }
};
