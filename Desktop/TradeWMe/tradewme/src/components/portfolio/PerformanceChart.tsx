'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const timeframes = ['24H', '7D', '30D', '90D', '1Y', 'ALL'];

export function PerformanceChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30D');

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg md:text-xl">Portfolio Performance</CardTitle>
          <div className="flex flex-wrap gap-2">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
                className="text-xs"
              >
                {timeframe}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] md:h-[300px] flex items-center justify-center border rounded-lg bg-muted/20">
          <div className="text-center px-4">
            <p className="text-sm md:text-base text-muted-foreground mb-2">Portfolio Value Chart</p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Chart showing {selectedTimeframe} performance
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Integration with Recharts/Chart.js for real data visualization
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}