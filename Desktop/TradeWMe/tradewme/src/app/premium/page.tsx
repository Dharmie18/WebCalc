import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PremiumPlans } from '@/components/tools/PremiumPlans';

export default function PremiumPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-10 md:py-16">
        <PremiumPlans />
      </main>

      <Footer />
    </div>
  );
}