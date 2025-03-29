
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/contexts/CollectionContext';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, BookOpen, Camera, BarChart2 } from 'lucide-react';
import CollectionItemCard from '@/components/collection/CollectionItemCard';

const Dashboard = () => {
  const { user } = useAuth();
  const { collections, loading, refreshCollections } = useCollection();

  useEffect(() => {
    refreshCollections();
  }, []);

  const getCollectionValue = () => {
    return collections.reduce((total, item) => total + item.priceEstimate.marketValue, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTopCategories = () => {
    const categories: Record<string, number> = {};
    collections.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));
  };

  const getMostValuableItems = () => {
    return [...collections]
      .sort((a, b) => b.priceEstimate.marketValue - a.priceEstimate.marketValue)
      .slice(0, 3);
  };

  return (
    <MainLayout title={`Welcome, ${user?.name}`}>
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Collection Value</CardTitle>
              <CardDescription>Estimated total value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-collector-navy">
                {loading ? (
                  <div className="h-9 w-32 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  formatCurrency(getCollectionValue())
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Collection Size</CardTitle>
              <CardDescription>Total number of items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-collector-navy">
                {loading ? (
                  <div className="h-9 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  collections.length
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Last Added</CardTitle>
              <CardDescription>Most recent additions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-9 w-40 bg-gray-200 animate-pulse rounded"></div>
              ) : collections.length > 0 ? (
                <div className="text-lg font-medium text-collector-navy">
                  {collections[0].name}
                </div>
              ) : (
                <div className="text-gray-500">No items yet</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/add-item">
              <Button variant="outline" className="w-full h-full py-6 flex flex-col items-center justify-center space-y-2">
                <Plus className="h-6 w-6" />
                <span>Add Item</span>
              </Button>
            </Link>
            <Link to="/scan">
              <Button variant="outline" className="w-full h-full py-6 flex flex-col items-center justify-center space-y-2">
                <Camera className="h-6 w-6" />
                <span>Scan Item</span>
              </Button>
            </Link>
            <Link to="/collection">
              <Button variant="outline" className="w-full h-full py-6 flex flex-col items-center justify-center space-y-2">
                <BookOpen className="h-6 w-6" />
                <span>View Collection</span>
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" className="w-full h-full py-6 flex flex-col items-center justify-center space-y-2">
                <BarChart2 className="h-6 w-6" />
                <span>Analytics</span>
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Categories Summary */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
              <CardDescription>Most common categories in your collection</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : collections.length > 0 ? (
                <div className="space-y-4">
                  {getTopCategories().map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium">{item.category}</span>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">{item.count} items</span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-collector-gold"
                            style={{ width: `${(item.count / collections.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No items in your collection yet</p>
                  <Link to="/add-item">
                    <Button variant="link" className="mt-2">
                      Add your first item
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
            {collections.length > 0 && (
              <CardFooter>
                <Link to="/collection" className="w-full">
                  <Button variant="ghost" className="w-full">
                    View All Categories
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Most Valuable Items</CardTitle>
              <CardDescription>Highest valued items in your collection</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : collections.length > 0 ? (
                <div className="space-y-4">
                  {getMostValuableItems().map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-md overflow-hidden mr-3 flex-shrink-0">
                          {item.images && item.images.length > 0 && (
                            <img 
                              src={item.images[0]} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-medium line-clamp-1">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category}</div>
                        </div>
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(item.priceEstimate.marketValue)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No items in your collection yet</p>
                  <Link to="/add-item">
                    <Button variant="link" className="mt-2">
                      Add your first item
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
            {collections.length > 0 && (
              <CardFooter>
                <Link to="/collection" className="w-full">
                  <Button variant="ghost" className="w-full">
                    View All Items
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>
        </div>
        
        {/* Recent Items */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Additions</h2>
            <Link to="/collection">
              <Button variant="link" className="text-collector-navy">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-72 bg-gray-200 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : collections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {collections.slice(0, 4).map(item => (
                <CollectionItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-xl font-semibold mb-2">Your collection is empty</h3>
                <p className="text-gray-500 mb-6">
                  Start building your collection by adding your first item or scanning an object
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
