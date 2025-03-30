
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Check, Package } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await register(email, name, password);
      if (success) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout showHeader={false} showFooter={false}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-collector-purple to-collector-cyan p-4">
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="flex items-center mb-4">
            <Package className="h-10 w-10 text-collector-gold" />
            <span className="text-3xl font-bold ml-2 bg-clip-text text-transparent bg-gradient-to-r from-collector-gold to-white">
              The Collectors Portal
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-center text-white">Create your Collectors Portal account</h1>
          <p className="text-gray-200 mt-2 text-center">
            Start organizing and valuing your collection today
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create an account to start managing your collection
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button 
                type="submit" 
                className="w-full bg-collector-purple hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
              
              <div className="mt-6 space-y-2">
                <p className="text-xs text-gray-500 flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>By signing up, you agree to our Terms of Service and Privacy Policy</span>
                </p>
              </div>
              
              <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-collector-cyan hover:text-collector-purple">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-8">
          <Link to="/" className="text-sm text-white hover:text-collector-gold">
            ← Back to home
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
