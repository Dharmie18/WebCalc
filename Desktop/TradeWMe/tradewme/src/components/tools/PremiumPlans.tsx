'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Basic price alerts (5 max)',
      '1 watchlist',
      'Standard trading',
      'Basic market data',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: 'per month',
    features: [
      'Unlimited price alerts',
      'Unlimited watchlists',
      'Advanced analytics',
      'Real-time market data',
      'Priority support',
      'Custom API access',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$49.99',
    period: 'per month',
    features: [
      'Everything in Pro',
      'Advanced trading strategies',
      'Portfolio rebalancing',
      'Dedicated account manager',
      'White-label options',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
  },
];

export function PremiumPlans() {
  const handleSubscribe = async (plan: string) => {
    // In production, integrate with Stripe
    console.log('Subscribing to:', plan);
    
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1, // Get from auth
          plan: plan.toLowerCase(),
          stripeCustomerId: 'cus_mock',
          stripeSubscriptionId: 'sub_mock',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (response.ok) {
        console.log('Subscription created successfully');
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
          <h2 className="text-2xl md:text-3xl font-bold">Upgrade to Premium</h2>
        </div>
        <p className="text-sm md:text-base text-muted-foreground">
          Unlock advanced features and take your trading to the next level
        </p>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.popular ? 'border-primary shadow-lg' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-lg md:text-xl">{plan.name}</CardTitle>
                {plan.popular && (
                  <Badge>Most Popular</Badge>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl font-bold">{plan.price}</span>
                <span className="text-sm md:text-base text-muted-foreground">/{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 md:space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                disabled={plan.disabled}
                onClick={() => handleSubscribe(plan.name)}
              >
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}