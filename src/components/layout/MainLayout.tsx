
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, LogOut, Home, Plus, User, BookOpen, Sparkles, Archive, Package } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  showHeader = true,
  showFooter = true,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {showHeader && (
        <header className="border-b border-gray-200 backdrop-blur-md bg-white/90 sticky top-0 z-50 shadow-sm">
          <div className="container max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="relative">
                <Package className="h-8 w-8 text-collector-purple relative z-10" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-collector-purple to-collector-cyan bg-clip-text text-transparent">
                The Collectors Portal
              </span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" className="text-gray-700 hover:text-collector-purple hover:bg-collector-pastel-purple">
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/collection">
                    <Button variant="ghost" className="text-gray-700 hover:text-collector-purple hover:bg-collector-pastel-purple">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Collection
                    </Button>
                  </Link>
                  <Link to="/add-item">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </Link>
                  <Link to="/scan">
                    <Button className="bg-collector-purple hover:bg-purple-700 text-white">
                      <Camera className="mr-2 h-4 w-4" />
                      Scan
                    </Button>
                  </Link>
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="bg-collector-cyan text-white p-2 rounded-full">
                      <User className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{user.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleLogout} 
                      title="Logout"
                      className="text-gray-500 hover:text-gray-800"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-700 border-gray-300 hover:bg-collector-pastel-purple">Log in</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-collector-purple hover:bg-purple-700">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">
        {title && (
          <div className="container max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-collector-purple to-collector-cyan bg-clip-text text-transparent">{title}</h1>
          </div>
        )}
        {children}
      </main>

      {showFooter && (
        <footer className="border-t border-gray-200 py-6 mt-auto bg-white">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <Link to="/" className="flex items-center space-x-2">
                  <Package className="h-6 w-6 text-collector-purple" />
                  <span className="text-xl font-bold bg-gradient-to-r from-collector-purple to-collector-cyan bg-clip-text text-transparent">
                    The Collectors Portal
                  </span>
                </Link>
              </div>
              <div className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} The Collectors Portal. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;
