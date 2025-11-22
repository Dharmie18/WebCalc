'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: number;
  userId: number;
  userEmail: string;
  txHash: string;
  type: string;
  tokenIn: string | null;
  tokenOut: string | null;
  amountIn: number | null;
  amountOut: number | null;
  gasFee: number | null;
  status: string;
  timestamp: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AdminTransactions() {
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = async (page: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/admin/transactions?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();
      setData(result);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  const handlePrevPage = () => {
    if (data && currentPage > 1) {
      fetchTransactions(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (data && currentPage < data.pagination.totalPages) {
      fetchTransactions(currentPage + 1);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>All transactions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          Showing {data.transactions.length} of {data.pagination.total} transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Swap</th>
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">Gas</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Time</th>
                  <th className="text-left py-3 px-2">Hash</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 text-sm">{tx.userEmail}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline">{tx.type}</Badge>
                    </td>
                    <td className="py-3 px-2">
                      {tx.tokenIn && tx.tokenOut ? (
                        <div className="flex items-center gap-1 text-sm">
                          <span>{tx.tokenIn}</span>
                          <ArrowRightLeft className="h-3 w-3" />
                          <span>{tx.tokenOut}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {tx.amountOut ? tx.amountOut.toFixed(4) : '-'}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {tx.gasFee ? `$${tx.gasFee.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-2">{getStatusBadge(tx.status)}</td>
                    <td className="py-3 px-2 text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <a
                        href={`https://etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
                      >
                        {tx.txHash.slice(0, 6)}...
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {data.transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{tx.userEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {getStatusBadge(tx.status)}
                    </div>
                    
                    {tx.tokenIn && tx.tokenOut && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{tx.tokenIn}</Badge>
                        <ArrowRightLeft className="h-4 w-4" />
                        <Badge variant="outline">{tx.tokenOut}</Badge>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Amount</p>
                        <p className="font-medium">
                          {tx.amountOut ? tx.amountOut.toFixed(4) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Gas Fee</p>
                        <p className="font-medium">
                          {tx.gasFee ? `$${tx.gasFee.toFixed(2)}` : '-'}
                        </p>
                      </div>
                    </div>
                    
                    <a
                      href={`https://etherscan.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
                    >
                      View on Etherscan
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === data.pagination.totalPages}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
