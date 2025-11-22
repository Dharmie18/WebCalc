import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">PocketBroker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your non-custodial gateway to decentralized trading
            </p>
          </div>

          <div>
            <h3 className="mb-3 md:mb-4 text-sm font-semibold">Products</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/trade" className="text-sm text-muted-foreground hover:text-foreground">
                  Swap
                </Link>
              </li>
              <li>
                <Link href="/markets" className="text-sm text-muted-foreground hover:text-foreground">
                  Markets
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-sm text-muted-foreground hover:text-foreground">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground">
                  Tools
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 md:mb-4 text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-sm text-muted-foreground hover:text-foreground">
                  API
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-muted-foreground hover:text-foreground">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 md:mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 md:mt-12 border-t pt-6 md:pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PocketBroker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}