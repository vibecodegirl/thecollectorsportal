
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCollection } from '@/contexts/CollectionContext';
import CollectionItemCard from '@/components/collection/CollectionItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Camera, Filter, Plus, Search, SortAsc, SortDesc } from 'lucide-react';

const CollectionGallery = () => {
  const { collections, loading } = useCollection();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filteredCollections, setFilteredCollections] = useState(collections);
  
  // Get unique categories
  const categories = ['all', ...new Set(collections.map(item => item.category))];
  
  useEffect(() => {
    let result = [...collections];
    
    // Apply search
    if (searchTerm) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter(item => item.category === filterCategory);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'value':
          comparison = a.priceEstimate.marketValue - b.priceEstimate.marketValue;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'dateAdded':
        default:
          comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredCollections(result);
  }, [collections, searchTerm, filterCategory, sortBy, sortOrder]);
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <MainLayout title="My Collection">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Search and filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, category, or manufacturer..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Link to="/add-item">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </Link>
              <Link to="/scan">
                <Button variant="outline">
                  <Camera className="mr-2 h-4 w-4" />
                  Scan
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 flex-grow">
              <Filter className="text-gray-400 h-4 w-4" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <SortAsc className="text-gray-400 h-4 w-4" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dateAdded">Date Added</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="ghost" size="icon" onClick={toggleSortOrder}>
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Collection items */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : filteredCollections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCollections.map(item => (
              <CollectionItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            {searchTerm || filterCategory !== 'all' ? (
              <>
                <h3 className="text-xl font-semibold mb-2">No matching items found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('all');
                }}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">Your collection is empty</h3>
                <p className="text-gray-500 mb-6">
                  Start building your collection by adding your first item
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link to="/add-item">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item Manually
                    </Button>
                  </Link>
                  <Link to="/scan">
                    <Button variant="outline">
                      <Camera className="mr-2 h-4 w-4" />
                      Scan an Item
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CollectionGallery;
