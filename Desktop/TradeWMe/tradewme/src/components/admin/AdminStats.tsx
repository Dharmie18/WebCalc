'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, Crown, Wallet, Bell, List, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  totalUsers: number;
  totalTransactions: number;
  totalTransactionVolume: number;
  activeSubscriptions: number;
  premiumUsers: number;
  totalPortfolios: number;
  totalWatchlists: number;
  totalPriceAlerts: number;
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      gradient: 'from-blue-600 to-cyan-500',
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString(),
      icon: TrendingUp,
      gradient: 'from-green-600 to-emerald-500',
    },
    {
      title: 'Transaction Volume',
      value: `$${stats.totalTransactionVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      gradient: 'from-purple-600 to-pink-500',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions.toLocaleString(),
      icon: Crown,
      gradient: 'from-yellow-600 to-orange-500',
    },
    {
      title: 'Premium Users',
      value: stats.premiumUsers.toLocaleString(),
      icon: Activity,
      gradient: 'from-indigo-600 to-blue-500',
    },
    {
      title: 'Total Portfolios',
      value: stats.totalPortfolios.toLocaleString(),
      icon: Wallet,
      gradient: 'from-cyan-600 to-teal-500',
    },
    {
      title: 'Total Watchlists',
      value: stats.totalWatchlists.toLocaleString(),
      icon: List,
      gradient: 'from-pink-600 to-rose-500',
    },
    {
      title: 'Price Alerts',
      value: stats.totalPriceAlerts.toLocaleString(),
      icon: Bell,
      gradient: 'from-red-600 to-orange-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
