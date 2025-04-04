
import { supabase } from "@/integrations/supabase/client";
import { CollectionItem } from "@/types/collection";
import { transformDatabaseItemToCollectionItem, transformCollectionItemToDatabase } from "@/utils/collectionTransformers";

/**
 * Get all collection items for a user
 */
export const getCollectionItems = async (userId: string): Promise<CollectionItem[]> => {
  const { data, error } = await supabase
    .from("collection_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching collection items", error);
    throw new Error(error.message);
  }

  console.log(`Fetched ${data.length} collection items for user ${userId}`);
  return data.map(transformDatabaseItemToCollectionItem);
};

/**
 * Get a single collection item by ID
 */
export const getCollectionItemById = async (
  itemId: string,
  userId: string
): Promise<CollectionItem | null> => {
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
};

/**
 * Create a new collection item
 */
export const createCollectionItem = async (
  item: Partial<CollectionItem>,
  userId: string
): Promise<CollectionItem> => {
  // Transform the item for the database, which will strip any properties not in the schema
  const dbItem = transformCollectionItemToDatabase(item, userId);

  // Log what we're sending to the database for debugging
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
};

/**
 * Update an existing collection item
 */
export const updateCollectionItem = async (
  id: string,
  item: Partial<CollectionItem>,
  userId: string
): Promise<CollectionItem> => {
  // Transform the item for the database, which will strip any properties not in the schema
  const dbItem = transformCollectionItemToDatabase({ ...item, id }, userId);

  // Log what we're sending to the database for debugging
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

  console.log("Updated item result:", data);
  return transformDatabaseItemToCollectionItem(data);
};

/**
 * Delete a collection item
 */
export const deleteCollectionItem = async (
  id: string,
  userId: string
): Promise<void> => {
  console.log(`Deleting collection item ${id} for user ${userId}`);
  
  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting collection item", error);
    throw new Error(error.message);
  }
  
  console.log(`Successfully deleted item ${id}`);
};
