import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Edit, Eye, Trash, Archive } from 'lucide-react';
import { useCollection } from '@/contexts/CollectionContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
interface CollectionItemActionsProps {
  itemId: string;
  itemName: string;
  onItemAction?: () => void; // Callback for triggering a refresh
}
const CollectionItemActions: React.FC<CollectionItemActionsProps> = ({
  itemId,
  itemName,
  onItemAction
}) => {
  const {
    deleteItem,
    archiveItem
  } = useCollection();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const handleDelete = async () => {
    try {
      console.log("Deleting item:", itemId);
      await deleteItem(itemId);
      if (onItemAction) {
        console.log("Calling onItemAction after deletion");
        onItemAction(); // Call the callback after deletion
      }
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };
  const handleArchive = async () => {
    try {
      console.log("Archiving item:", itemId);
      await archiveItem(itemId);
      if (onItemAction) {
        console.log("Calling onItemAction after archiving");
        onItemAction(); // Call the callback after archiving
      }
      setIsArchiveDialogOpen(false);
    } catch (error) {
      console.error('Error archiving item:', error);
    }
  };
  return <>
      <div className="flex gap-1">
        <Link to={`/collection/${itemId}`}>
          <Button variant="ghost" size="sm">
            <Eye className="mr-1 h-4 w-4" />
            View
          </Button>
        </Link>
        <Link to={`/collection/${itemId}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>
      <div className="flex gap-1">
        <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
          <AlertDialogTrigger asChild>
            
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive "{itemName}"? It will be moved to your archives.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-red-500">
              <Trash className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{itemName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>;
};
export default CollectionItemActions;