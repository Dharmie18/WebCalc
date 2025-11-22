'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Crown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Activity {
  id: string;
  type: 'transaction' | 'new_user' | 'new_subscription';
  timestamp: string;
  userId: number;
  userEmail: string;
  details: any;
}

interface ActivityResponse {
  activities: Activity[];
}

export function AdminRecentActivity() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/admin/recent-activity', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast.error('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'new_user':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'new_subscription':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'Transaction';
      case 'new_user':
        return 'New User';
      case 'new_subscription':
        return 'New Subscription';
      default:
        return type;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 20 activities across the platform</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivity}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border"
            >
              <div className="mt-1">{getActivityIcon(activity.type)}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{getActivityLabel(activity.type)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm font-medium truncate">{activity.userEmail}</p>
                
                {activity.type === 'transaction' && activity.details && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.details.tokenIn} → {activity.details.tokenOut}
                    {activity.details.amountOut && ` (${activity.details.amountOut.toFixed(4)})`}
                  </p>
                )}
                
                {activity.type === 'new_subscription' && activity.details && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Plan: {activity.details.plan} • Status: {activity.details.status}
                  </p>
                )}
                
                {activity.type === 'new_user' && activity.details && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined the platform
                  </p>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                {new Date(activity.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
