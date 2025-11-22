'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Subscription {
  id: number;
  userId: number;
  userEmail: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  createdAt: string;
}

interface SubscriptionsResponse {
  subscriptions: Subscription[];
  total: number;
}

export function AdminSubscriptions() {
  const [data, setData] = useState<SubscriptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/admin/subscriptions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500">Past Due</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-blue-500',
      pro: 'bg-purple-500',
      premium: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    };

    return (
      <Badge className={colors[plan.toLowerCase()] || 'bg-gray-500'}>
        <Crown className="h-3 w-3 mr-1" />
        {plan}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Active and past subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Active and past subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No subscriptions found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <CardDescription>
          Total subscriptions: {data.total}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">ID</th>
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Plan</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Period End</th>
                  <th className="text-left py-3 px-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-mono text-sm">{sub.id}</td>
                    <td className="py-3 px-2">{sub.userEmail}</td>
                    <td className="py-3 px-2">{getPlanBadge(sub.plan)}</td>
                    <td className="py-3 px-2">{getStatusBadge(sub.status)}</td>
                    <td className="py-3 px-2 text-sm">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {data.subscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{sub.userEmail}</p>
                        <p className="text-xs text-muted-foreground">ID: {sub.id}</p>
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getPlanBadge(sub.plan)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                      <div>
                        <p className="text-muted-foreground text-xs">Period Ends</p>
                        <p className="font-medium">
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Created</p>
                        <p className="font-medium">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
