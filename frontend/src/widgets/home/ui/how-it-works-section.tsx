import { BrainCircuit, Filter, Layers, Mail } from 'lucide-react';

export function HowItWorksSection() {
  return (
    <section className="w-full py-24 bg-white border-t border-muted/50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-20">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            A Better Way to Discover Literature
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Configure once, and let Scholar Pulse handle the noise. From raw academic feeds to a 3-minute morning read.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-4 max-w-6xl mx-auto">
          
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-6 relative group">
            <div className="hidden lg:block absolute top-10 -right-[4.5rem] w-32 border-t-2 border-dashed border-indigo-200" />
            <div className="bg-indigo-50 p-6 rounded-2xl text-indigo-600 ring-1 ring-indigo-200 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Layers className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-xl text-foreground">1. Set Up Topics</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Create up to <strong className="text-foreground">5 custom topics</strong>. Track specific niches without crossing streams.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-6 relative group">
            <div className="hidden lg:block absolute top-10 -right-[4.5rem] w-32 border-t-2 border-dashed border-indigo-200" />
            <div className="bg-cyan-50 p-6 rounded-2xl text-cyan-600 ring-1 ring-cyan-200 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Filter className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-xl text-foreground">2. Add Keywords</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Equip each topic with up to <strong className="text-foreground">10 keywords</strong>. We search across Semantic Scholar & ArXiv.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-6 relative group">
            <div className="hidden lg:block absolute top-10 -right-[4.5rem] w-32 border-t-2 border-dashed border-indigo-200" />
            <div className="bg-fuchsia-50 p-6 rounded-2xl text-fuchsia-600 ring-1 ring-fuchsia-200 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <BrainCircuit className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-xl text-foreground">3. AI Analysis</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We pull new papers natively, apply SJR rank filters, and generate <strong className="text-foreground">3-line summaries</strong> using state-of-the-art AI.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center space-y-6 relative group">
            <div className="bg-emerald-50 p-6 rounded-2xl text-emerald-600 ring-1 ring-emerald-200 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Mail className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-xl text-foreground">4. Morning Digest</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Receive a daily or weekly <strong className="text-foreground">email report</strong> outlining only the most relevant breakthroughs.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
