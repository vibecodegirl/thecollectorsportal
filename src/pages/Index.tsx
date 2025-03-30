
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, BookOpen, Camera, Check, Shield, Clock, Sparkles, Database } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <MainLayout showHeader={true} showFooter={true}>
      {/* Hero Section with Time Warp Effect */}
      <section className="py-16 md:py-24 gradient-background overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent z-0"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full bg-white" 
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 4 + 1}px`,
                  height: `${Math.random() * 4 + 1}px`,
                  opacity: Math.random() * 0.5 + 0.3,
                  animationDuration: `${Math.random() * 50 + 10}s`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
                <span className="time-warp-text">Travel Through Time</span> with Your Collection
              </h1>
              <p className="text-lg md:text-xl text-gray-100">
                Collectopia helps hobbyists catalog, organize, and value their collectibles with AI-powered insights from any era.
              </p>
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link to="/dashboard">
                    <Button size="lg" className="bg-collector-gold hover:bg-amber-500 text-black animate-pulse-glow">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="lg" className="bg-collector-gold hover:bg-amber-500 text-black animate-pulse-glow">
                        Create Free Account
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button size="lg" variant="outline" className="text-white border-white bg-white/10 backdrop-blur-sm hover:bg-white/20">
                        Log In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-full h-full rounded-lg bg-collector-gold opacity-70 blur-md animate-pulse"></div>
                <img 
                  src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=600" 
                  alt="Collection showcase" 
                  className="rounded-lg shadow-lg relative z-10 animate-float"
                />
                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-collector-purple opacity-60 blur-md"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">How <span className="time-warp-text">Collectopia</span> Works</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Our platform combines AI technology with collector expertise to help you manage and value your collection from any time period.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-gray-700 hover:border-collector-cyan transition-all duration-300 retro-card">
              <div className="w-12 h-12 bg-collector-cyan/20 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-collector-cyan" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Scan Your Items</h3>
              <p className="text-gray-300">
                Simply scan your collectibles or upload images to start the identification process.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-gray-700 hover:border-collector-magenta transition-all duration-300 retro-card">
              <div className="w-12 h-12 bg-collector-magenta/20 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-collector-magenta" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">AI-Powered Analysis</h3>
              <p className="text-gray-300">
                Our AI analyzes your items, providing detailed descriptions, condition assessments, and market valuations.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-gray-700 hover:border-collector-orange transition-all duration-300 retro-card">
              <div className="w-12 h-12 bg-collector-orange/20 rounded-full flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-collector-orange" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Build Your Gallery</h3>
              <p className="text-gray-300">
                Create a beautiful digital gallery of your collection with comprehensive details and valuations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Time Periods Section */}
      <section className="py-16 bg-gray-800 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1597423244036-ef5020e83f3c?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=1800')] bg-cover bg-center"></div>
        </div>
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">Explore <span className="time-warp-text">Every Era</span></h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              From ancient artifacts to modern memorabilia, Collectopia helps you catalog items from any time period.
            </p>
          </div>
          
          <div className="flex overflow-x-auto pb-6 gap-6 snap-x">
            {[
              { era: "Ancient", year: "3000 BCE - 500 CE", color: "bg-collector-gold/20 border-collector-gold" },
              { era: "Medieval", year: "500 - 1500", color: "bg-collector-purple/20 border-collector-purple" },
              { era: "Renaissance", year: "1400 - 1600", color: "bg-collector-cyan/20 border-collector-cyan" },
              { era: "Industrial", year: "1760 - 1840", color: "bg-collector-magenta/20 border-collector-magenta" },
              { era: "Modern", year: "1900 - 2000", color: "bg-collector-orange/20 border-collector-orange" },
              { era: "Contemporary", year: "2000 - Present", color: "bg-collector-navy/20 border-collector-navy" }
            ].map((timeEra, i) => (
              <div 
                key={i} 
                className={`flex-shrink-0 w-60 h-40 ${timeEra.color} backdrop-blur-sm border rounded-lg p-4 flex flex-col justify-center items-center snap-center animate-float`}
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <Clock className="h-8 w-8 mb-2 text-white" />
                <h3 className="text-xl font-bold text-white">{timeEra.era}</h3>
                <p className="text-gray-300 text-sm">{timeEra.year}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">What <span className="time-warp-text">Collectors</span> Say</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Join thousands of collectors who are organizing and discovering the true value of their collections.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-lg border border-gray-700 hover:border-collector-cyan transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <div className="w-12 h-12 bg-collector-cyan rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Michael T.</h4>
                  <p className="text-sm text-gray-400">Comic Book Collector</p>
                </div>
              </div>
              <p className="text-gray-300">
                "Collectopia has transformed how I manage my comic book collection. The AI valuation is surprisingly accurate, and I've discovered some of my books are worth more than I thought!"
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-lg border border-gray-700 hover:border-collector-magenta transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <div className="w-12 h-12 bg-collector-magenta rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Sarah K.</h4>
                  <p className="text-sm text-gray-400">Vintage Toy Enthusiast</p>
                </div>
              </div>
              <p className="text-gray-300">
                "I love how easy it is to catalog my vintage toy collection. The detailed descriptions and condition ratings help me keep track of everything, and the valuation gives me peace of mind for insurance purposes."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-background text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-black/30 z-0"></div>
        <div className="container max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-4">Ready to <span className="time-warp-text">Discover</span> Your Collection's Value?</h2>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
            Join Collectopia today and transform how you manage your collectibles with our AI-powered platform.
          </p>
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="bg-collector-gold hover:bg-amber-500 text-black animate-pulse-glow">
                Go to Your Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button size="lg" className="bg-collector-gold hover:bg-amber-500 text-black animate-pulse-glow">
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
