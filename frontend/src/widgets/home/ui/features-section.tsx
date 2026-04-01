import { Search, ShieldCheck, Zap } from 'lucide-react';

export function FeaturesSection() {
  return (
    <section className="w-full py-24 bg-slate-50 border-t border-slate-200">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-20 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
            Intelligent Research Curation
          </h2>
          <p className="max-w-[800px] text-slate-600 md:text-xl">
            We don&apos;t just search the web. We integrate deeply with academic APIs and Gemini to give you institutional-grade literature alerts.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          
          {/* Card 1 */}
          <div className="lg:col-span-2 row-span-2 group flex flex-col justify-between border border-slate-200 bg-white p-8 rounded-3xl hover:border-indigo-300 hover:shadow-lg transition-all duration-300 overflow-hidden relative">
            <div className="z-10 bg-indigo-50 w-fit p-3 rounded-xl mb-4 text-indigo-600">
              <Zap className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="z-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Automated Data Pipelines</h2>
              <p className="text-slate-600 text-lg leading-relaxed max-w-md">
                Scholar Pulse runs automatically in the background. It deduplicates articles across multiple sources (ArXiv, S2) and groups them perfectly into your personalized topics.
              </p>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-64 h-64 text-indigo-900" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col border border-slate-200 bg-white p-8 rounded-3xl hover:border-cyan-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="z-10 bg-cyan-50 w-fit p-3 rounded-xl mb-4 text-cyan-600">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="z-10">
              <h2 className="text-xl font-bold text-slate-900 mb-2">SJR Quality Control</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                We leverage Scimago Journal Rank (SJR) data to optionally restrict results to top-quartile (Q1/Q2) journals.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col border border-slate-200 bg-white p-8 rounded-3xl hover:border-fuchsia-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="z-10 bg-fuchsia-50 w-fit p-3 rounded-xl mb-4 text-fuchsia-600">
              <Search className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="z-10">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Multi-Keyword Search</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Target complex niches. Mix terms like &quot;LLM&quot;, &quot;RAG&quot;, and &quot;Agents&quot; inside a single Topic to pinpoint exact intersections.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
