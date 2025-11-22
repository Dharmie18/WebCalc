'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MostTradedToken {
  token: string;
  count: number;
  volume: number;
}

interface VolumeByDay {
  date: string;
  volume: number;
  count: number;
}

interface UserGrowth {
  date: string;
  newUsers: number;
}

interface AnalyticsData {
  mostTradedTokens: MostTradedToken[];
  transactionVolumeByDay: VolumeByDay[];
  userGrowth: UserGrowth[];
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolumeUsd: number;
  averageTransactionValue: number;
  averageGasFee: number;
  totalGasPaid: number;
}

export function AnalyticsCharts() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/admin/analytics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load analytics data
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Most Traded Tokens */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Most Traded Tokens
          </CardTitle>
          <CardDescription>Top 10 tokens by transaction count and volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.mostTradedTokens.slice(0, 10).map((token, index) => (
              <div key={token.token} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{token.token}</p>
                    <p className="text-xs text-muted-foreground">
                      {token.count.toLocaleString()} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${token.volume.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Volume</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Volume by Day */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Transaction Volume (Last 30 Days)
          </CardTitle>
          <CardDescription>Daily transaction volume and count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.transactionVolumeByDay.slice(0, 10).map((day) => (
              <div key={day.date} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(day.date), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">{day.count} transactions</p>
                </div>
                <p className="font-semibold">${day.volume.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Growth (Last 30 Days)
          </CardTitle>
          <CardDescription>New user registrations per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.userGrowth.slice(0, 10).map((day) => (
              <div key={day.date} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                <p className="text-sm font-medium">
                  {format(new Date(day.date), 'MMM dd, yyyy')}
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(day.newUsers * 10, 100)}px` }} />
                  <p className="font-semibold min-w-[30px] text-right">{day.newUsers}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Platform Statistics</CardTitle>
          <CardDescription>Detailed platform metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Average Transaction Value</p>
              <p className="text-2xl font-bold mt-1">${analytics.averageTransactionValue.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Average Gas Fee</p>
              <p className="text-2xl font-bold mt-1">{analytics.averageGasFee.toFixed(6)} ETH</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Gas Paid</p>
              <p className="text-2xl font-bold mt-1">{analytics.totalGasPaid.toFixed(4)} ETH</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
