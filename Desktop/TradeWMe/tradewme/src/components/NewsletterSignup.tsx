'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubscribed(true);
    toast.success('Successfully subscribed to newsletter!');
    setEmail('');
    setLoading(false);
    
    // Reset after 3 seconds
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="flex justify-center mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-7 w-7 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold">Stay Updated</h2>
      <p className="mt-4 text-base md:text-lg text-muted-foreground">
        Subscribe to our newsletter for market insights, trading tips, and platform updates
      </p>
      
      {subscribed ? (
        <div className="mt-8 flex flex-col items-center gap-3 animate-fade-in">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-lg font-medium text-green-500">Thank you for subscribing!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto px-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading} className="gap-2 hover:scale-105 transition-transform">
            {loading ? 'Subscribing...' : 'Subscribe'}
            <Mail className="h-4 w-4" />
          </Button>
        </form>
      )}
      
      <p className="mt-4 text-xs text-muted-foreground">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
}
