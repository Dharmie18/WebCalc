'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface Watchlist {
  id: string;
  name: string;
  tokens: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    logo: string;
  }[];
}

const mockWatchlists: Watchlist[] = [
  {
    id: '1',
    name: 'My Portfolio',
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3245.67,
        change: 8.4,
        logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: 142.89,
        change: 12.3,
        logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
      },
    ],
  },
];

export function Watchlists() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(mockWatchlists);
  const [open, setOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>(
    watchlists[0]?.id || ''
  );

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName) return;

    try {
      const response = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1, // Get from auth
          name: newWatchlistName,
          tokens: [],
        }),
      });

      if (response.ok) {
        const newWatchlist: Watchlist = {
          id: Date.now().toString(),
          name: newWatchlistName,
          tokens: [],
        };
        setWatchlists([...watchlists, newWatchlist]);
        setNewWatchlistName('');
        setOpen(false);
      }
    } catch (error) {
      console.error('Failed to create watchlist:', error);
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    try {
      await fetch(`/api/watchlists?id=${id}`, {
        method: 'DELETE',
      });
      setWatchlists(watchlists.filter((w) => w.id !== id));
      if (selectedWatchlist === id) {
        setSelectedWatchlist(watchlists[0]?.id || '');
      }
    } catch (error) {
      console.error('Failed to delete watchlist:', error);
    }
  };

  const currentWatchlist = watchlists.find((w) => w.id === selectedWatchlist);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Watchlists
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Watchlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Watchlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Watchlist Name</Label>
                  <Input
                    placeholder="My Watchlist"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateWatchlist} className="w-full">
                  Create Watchlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {watchlists.map((watchlist) => (
              <Button
                key={watchlist.id}
                variant={selectedWatchlist === watchlist.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedWatchlist(watchlist.id)}
              >
                {watchlist.name}
              </Button>
            ))}
          </div>

          {currentWatchlist && currentWatchlist.tokens.length > 0 ? (
            <div className="space-y-3">
              {currentWatchlist.tokens.map((token) => (
                <div
                  key={token.symbol}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden">
                      <Image
                        src={token.logo}
                        alt={token.name}
                        width={40}
                        height={40}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{token.symbol}</p>
                      <p className="text-sm text-muted-foreground">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${token.price.toLocaleString()}</p>
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        token.change >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {token.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {token.change >= 0 ? '+' : ''}
                        {token.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tokens in this watchlist</p>
              <p className="text-sm">Add tokens to track their prices</p>
            </div>
          )}

          {currentWatchlist && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => handleDeleteWatchlist(currentWatchlist.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Watchlist
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
