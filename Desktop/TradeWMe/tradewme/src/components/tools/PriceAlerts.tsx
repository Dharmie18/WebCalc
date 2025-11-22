'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Alert {
  id: string;
  token: string;
  condition: 'above' | 'below';
  price: number;
  currentPrice: number;
  triggered: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    token: 'ETH',
    condition: 'above',
    price: 3500,
    currentPrice: 3245.67,
    triggered: false,
  },
  {
    id: '2',
    token: 'BTC',
    condition: 'below',
    price: 60000,
    currentPrice: 64320.45,
    triggered: false,
  },
];

export function PriceAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [open, setOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    token: '',
    condition: 'above' as 'above' | 'below',
    price: '',
  });

  const handleCreateAlert = async () => {
    if (!newAlert.token || !newAlert.price) return;

    const alert: Alert = {
      id: Date.now().toString(),
      token: newAlert.token,
      condition: newAlert.condition,
      price: parseFloat(newAlert.price),
      currentPrice: 0, // Would fetch from API
      triggered: false,
    };

    // Call API to create alert
    try {
      const response = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1, // Get from auth
          tokenSymbol: alert.token,
          tokenAddress: '0x...', // Lookup token address
          condition: alert.condition,
          targetPrice: alert.price,
        }),
      });

      if (response.ok) {
        setAlerts([...alerts, alert]);
        setNewAlert({ token: '', condition: 'above', price: '' });
        setOpen(false);
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await fetch(`/api/price-alerts?id=${id}`, {
        method: 'DELETE',
      });
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alerts
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Price Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Token</Label>
                  <Input
                    placeholder="ETH, BTC, SOL..."
                    value={newAlert.token}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, token: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={newAlert.condition}
                    onValueChange={(value: 'above' | 'below') =>
                      setNewAlert({ ...newAlert, condition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Price goes above</SelectItem>
                      <SelectItem value="below">Price goes below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Price ($)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newAlert.price}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, price: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleCreateAlert} className="w-full">
                  Create Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No price alerts yet</p>
            <p className="text-sm">Create an alert to get notified</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{alert.token}</span>
                    <Badge variant={alert.triggered ? 'default' : 'secondary'}>
                      {alert.triggered ? 'Triggered' : 'Active'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Alert when price goes{' '}
                    <span className="font-medium">{alert.condition}</span>{' '}
                    <span className="font-medium">${alert.price.toLocaleString()}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteAlert(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
