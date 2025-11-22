'use client';

import { useEffect, useState, useRef } from 'react';
import { Users, TrendingUp, DollarSign, Globe } from 'lucide-react';

interface Stat {
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
}

export function StatsCounter() {
  const [counts, setCounts] = useState({ users: 0, trades: 0, volume: 0, countries: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const stats: Stat[] = [
    {
      label: 'Active Users',
      value: counts.users,
      suffix: 'K+',
      icon: <Users className="h-6 w-6" />,
    },
    {
      label: 'Trades Executed',
      value: counts.trades,
      suffix: 'M+',
      icon: <TrendingUp className="h-6 w-6" />,
    },
    {
      label: 'Trading Volume',
      value: counts.volume,
      suffix: 'B+',
      icon: <DollarSign className="h-6 w-6" />,
    },
    {
      label: 'Countries',
      value: counts.countries,
      suffix: '+',
      icon: <Globe className="h-6 w-6" />,
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          // Animate users counter
          let userCount = 0;
          const userInterval = setInterval(() => {
            userCount += 5;
            if (userCount >= 250) {
              userCount = 250;
              clearInterval(userInterval);
            }
            setCounts(prev => ({ ...prev, users: userCount }));
          }, 20);

          // Animate trades counter
          let tradeCount = 0;
          const tradeInterval = setInterval(() => {
            tradeCount += 2;
            if (tradeCount >= 100) {
              tradeCount = 100;
              clearInterval(tradeInterval);
            }
            setCounts(prev => ({ ...prev, trades: tradeCount }));
          }, 20);

          // Animate volume counter
          let volumeCount = 0;
          const volumeInterval = setInterval(() => {
            volumeCount += 1;
            if (volumeCount >= 50) {
              volumeCount = 50;
              clearInterval(volumeInterval);
            }
            setCounts(prev => ({ ...prev, volume: volumeCount }));
          }, 30);

          // Animate countries counter
          let countryCount = 0;
          const countryInterval = setInterval(() => {
            countryCount += 2;
            if (countryCount >= 150) {
              countryCount = 150;
              clearInterval(countryInterval);
            }
            setCounts(prev => ({ ...prev, countries: countryCount }));
          }, 15);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <div ref={sectionRef} className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className="flex flex-col items-center text-center p-6 rounded-xl bg-card hover:bg-muted/50 transition-all duration-300 hover:scale-105"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            {stat.icon}
          </div>
          <div className="text-3xl md:text-4xl font-bold">
            {stat.value}{stat.suffix}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
