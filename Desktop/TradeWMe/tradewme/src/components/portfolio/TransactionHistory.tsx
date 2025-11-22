'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const transactions = [
  {
    type: 'swap',
    from: 'ETH',
    to: 'USDC',
    amount: '1.234',
    value: '$4,000.23',
    hash: '0x1234...5678',
    status: 'confirmed',
    time: '2 hours ago',
  },
  {
    type: 'receive',
    from: '',
    to: 'ETH',
    amount: '0.567',
    value: '$1,840.45',
    hash: '0xabcd...efgh',
    status: 'confirmed',
    time: '5 hours ago',
  },
  {
    type: 'send',
    from: 'USDC',
    to: '',
    amount: '500',
    value: '$500.00',
    hash: '0x9876...5432',
    status: 'confirmed',
    time: '1 day ago',
  },
  {
    type: 'swap',
    from: 'SOL',
    to: 'ETH',
    amount: '10',
    value: '$1,428.90',
    hash: '0xijkl...mnop',
    status: 'pending',
    time: '2 days ago',
  },
];

export function TransactionHistory() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return <RefreshCw className="h-5 w-5" />;
      case 'receive':
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case 'send':
        return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getDescription = (tx: typeof transactions[0]) => {
    switch (tx.type) {
      case 'swap':
        return `Swap ${tx.amount} ${tx.from} to ${tx.to}`;
      case 'receive':
        return `Received ${tx.amount} ${tx.to}`;
      case 'send':
        return `Sent ${tx.amount} ${tx.from}`;
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop View */}
        <div className="hidden md:block space-y-4">
          {transactions.map((tx, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  {getIcon(tx.type)}
                </div>
                <div>
                  <p className="font-medium">{getDescription(tx)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">{tx.time}</p>
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {tx.hash}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{tx.value}</p>
                  <Badge
                    variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                  >
                    {tx.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {transactions.map((tx, index) => (
            <div key={index} className="p-4 rounded-lg border">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                  {getIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{getDescription(tx)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tx.time}</p>
                </div>
                <Badge
                  variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                  className="shrink-0"
                >
                  {tx.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Value</span>
                  <span className="font-medium">{tx.value}</span>
                </div>
                <a
                  href={`https://etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  View on Etherscan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Button variant="outline" className="w-full">
            Load More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}