import { BookOpen, Mail, Zap } from 'lucide-react';

export function HowItWorksSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            How it Works
          </h2>
          <p className="max-w-[600px] text-muted-foreground md:text-lg">
            Set it up once, get insights forever.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-4 relative">
            <div className="bg-primary/10 p-5 rounded-full text-primary">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-xl">1. Set Keywords</h3>
            <p className="text-sm text-muted-foreground">
              Type natural language or select preset keywords that match
              your exact research interests.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 relative">
            <div className="hidden sm:block absolute top-10 -right-16 w-32 border-t-2 border-dashed border-border" />
            <div className="bg-primary/10 p-5 rounded-full text-primary">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-xl">2. AI Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Our Gemini-powered engine scans S2 and arXiv, filtering by SJR
              Q1/Q2 rank to find top-tier papers.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 relative">
            <div className="hidden sm:block absolute top-10 -right-16 w-32 border-t-2 border-dashed border-border" />
            <div className="bg-primary/10 p-5 rounded-full text-primary">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-xl">3. Morning Delivery</h3>
            <p className="text-sm text-muted-foreground">
              Wake up to a beautifully formatted daily email with 3-line
              bullet summaries at 9:00 AM KST.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
