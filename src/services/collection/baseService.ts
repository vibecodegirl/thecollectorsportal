
import { CollectionItem } from '@/types/collection';
import { supabase } from '@/integrations/supabase/client';
import { 
  transformDatabaseItemToCollectionItem, 
  transformCollectionItemToDatabase 
} from '@/utils/collectionTransformers';

export const fetchCollectionItems = async (userId: string): Promise<CollectionItem[]> => {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    throw error;
  }
  
  return data.map(transformDatabaseItemToCollectionItem);
};

export const addCollectionItem = async (
  item: Omit<CollectionItem, 'id' | 'dateAdded' | 'lastUpdated'>, 
  userId: string
): Promise<CollectionItem> => {
  const supabaseItem = transformCollectionItemToDatabase({...item, userId});

  const { data, error } = await supabase
    .from('collection_items')
    .insert(supabaseItem)
    .select()
    .single();

  if (error) throw error;

  return transformDatabaseItemToCollectionItem(data);
};

export const updateCollectionItem = async (
  item: CollectionItem
): Promise<CollectionItem> => {
  const supabaseItem = transformCollectionItemToDatabase(item);

  const { data, error } = await supabase
    .from('collection_items')
    .update(supabaseItem)
    .eq('id', item.id)
    .select()
    .single();

  if (error) throw error;

  return transformDatabaseItemToCollectionItem(data);
};

export const deleteCollectionItem = async (itemId: string): Promise<boolean> => {
  const { error, count } = await supabase
    .from('collection_items')
    .delete()
    .eq('id', itemId)
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  
  if (count === 0) {
    throw new Error("Item not found or already deleted");
  }
  
  return true;
};
