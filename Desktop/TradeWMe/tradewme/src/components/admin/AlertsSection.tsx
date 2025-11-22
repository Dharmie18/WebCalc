'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, Loader2, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Transaction {
  id: number;
  txHash: string;
  type: string;
  status: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  gasFee: number;
  timestamp: string;
  suspiciousReason?: string;
  user: {
    id: number;
    name: string;
    email: string;
    walletAddress: string;
  };
}

interface AlertsSummary {
  totalFailed: number;
  totalSuspicious: number;
  failedLast24h: number;
  suspiciousLast24h: number;
}

export function AlertsSection() {
  const [failedTransactions, setFailedTransactions] = useState<Transaction[]>([]);
  const [suspiciousTransactions, setSuspiciousTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<AlertsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/admin/alerts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = await response.json();
      setFailedTransactions(data.failedTransactions);
      setSuspiciousTransactions(data.suspiciousTransactions);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Failed</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalFailed || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.failedLast24h || 0} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suspicious</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalSuspicious || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.suspiciousLast24h || 0} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Refresh</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Alerts update automatically every 60 seconds
            </p>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="mt-2 gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Failed Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Failed Transactions
          </CardTitle>
          <CardDescription>Last 100 failed transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {failedTransactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No failed transactions</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Transaction Hash</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedTransactions.slice(0, 20).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">
                        {format(new Date(tx.timestamp), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{tx.user.name}</span>
                          <span className="text-xs text-muted-foreground">{tx.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{tx.type}</TableCell>
                      <TableCell className="text-xs">
                        {tx.tokenIn} → {tx.tokenOut}
                      </TableCell>
                      <TableCell className="text-xs">{tx.amountIn?.toFixed(4)}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Failed</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspicious Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Suspicious Transactions
          </CardTitle>
          <CardDescription>
            Transactions with high gas fees (&gt;100) or high amounts (&gt;10,000)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suspiciousTransactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No suspicious transactions detected
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Transaction Hash</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Gas Fee</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspiciousTransactions.slice(0, 20).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">
                        {format(new Date(tx.timestamp), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{tx.user.name}</span>
                          <span className="text-xs text-muted-foreground">{tx.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          {tx.suspiciousReason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{tx.amountIn?.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{tx.gasFee?.toFixed(4)}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
