import { Search, Shield, Zap } from 'lucide-react';

export function FeaturesSection() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary/30">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 border border-border p-6 rounded-lg bg-card hover:border-primary/50 transition-colors">
            <div className="p-3 bg-primary/10 rounded-full">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Daily Automation</h2>
            <p className="text-center text-muted-foreground">
              We scan top journals and pre-print servers daily so you
              don&apos;t have to.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 border border-border p-6 rounded-lg bg-card hover:border-primary/50 transition-colors">
            <div className="p-3 bg-primary/10 rounded-full">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Smart Filtering</h2>
            <p className="text-center text-muted-foreground">
              Filter by SJR rank, citation count, and specific keywords to
              find the signal in the noise.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 border border-border p-6 rounded-lg bg-card hover:border-primary/50 transition-colors">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Premium Quality</h2>
            <p className="text-center text-muted-foreground">
              Focus on high-impact publications with our built-in journal
              ranking filters.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
