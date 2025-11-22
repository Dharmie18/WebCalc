'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, Activity, DollarSign } from 'lucide-react';

const portfolioStats = [
  {
    label: 'Total Balance',
    value: '$45,678.90',
    change: '+12.3%',
    isPositive: true,
    icon: Wallet,
  },
  {
    label: '24h P&L',
    value: '+$1,234.56',
    change: '+2.8%',
    isPositive: true,
    icon: TrendingUp,
  },
  {
    label: 'Total Invested',
    value: '$42,000.00',
    change: '',
    isPositive: true,
    icon: DollarSign,
  },
  {
    label: 'Active Positions',
    value: '8',
    change: '',
    isPositive: true,
    icon: Activity,
  },
];

export function PortfolioOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {portfolioStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p
                  className={`text-xs ${
                    stat.isPositive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {stat.change}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
