
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, BookOpen, Camera, Check, Shield } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <MainLayout showHeader={true} showFooter={true}>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-collector-navy to-gray-900 text-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                <span className="text-collector-gold">Organize</span> and <span className="text-collector-gold">Discover</span> Your Collection's True Value
              </h1>
              <p className="text-lg md:text-xl text-gray-300">
                Collectopia helps hobbyists catalog, organize, and value their collectibles with AI-powered insights.
              </p>
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link to="/dashboard">
                    <Button size="lg" className="bg-collector-gold hover:bg-amber-500 text-black">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="lg" className="bg-collector-gold hover:bg-amber-500 text-black">
                        Create Free Account
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                        Log In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-full h-full rounded-lg bg-collector-gold"></div>
                <img 
                  src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=600" 
                  alt="Collection showcase" 
                  className="rounded-lg shadow-lg relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-collector-navy">How Collectopia Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform combines AI technology with collector expertise to help you manage and value your collection.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-collector-navy" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Scan Your Items</h3>
              <p className="text-gray-600">
                Simply scan your collectibles or upload images to start the identification process.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-collector-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes your items, providing detailed descriptions, condition assessments, and market valuations.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Build Your Gallery</h3>
              <p className="text-gray-600">
                Create a beautiful digital gallery of your collection with comprehensive details and valuations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-collector-navy">What Collectors Say</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join thousands of collectors who are organizing and discovering the true value of their collections.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <div className="w-12 h-12 bg-collector-navy rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold">Michael T.</h4>
                  <p className="text-sm text-gray-500">Comic Book Collector</p>
                </div>
              </div>
              <p className="text-gray-700">
                "Collectopia has transformed how I manage my comic book collection. The AI valuation is surprisingly accurate, and I've discovered some of my books are worth more than I thought!"
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <div className="w-12 h-12 bg-collector-gold rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold">Sarah K.</h4>
                  <p className="text-sm text-gray-500">Vintage Toy Enthusiast</p>
                </div>
              </div>
              <p className="text-gray-700">
                "I love how easy it is to catalog my vintage toy collection. The detailed descriptions and condition ratings help me keep track of everything, and the valuation gives me peace of mind for insurance purposes."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-collector-navy text-white">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Discover Your Collection's Value?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join Collectopia today and transform how you manage your collectibles with our AI-powered platform.
          </p>
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="bg-collector-gold hover:bg-amber-500 text-black">
                Go to Your Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button size="lg" className="bg-collector-gold hover:bg-amber-500 text-black">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
          
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-collector-gold mr-2" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-collector-gold mr-2" />
              <span>Free for personal collections</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-collector-gold mr-2" />
              <span>Secure and private</span>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
