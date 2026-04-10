import Link from 'next/link';
import { Show, SignInButton } from '@clerk/nextjs';

import { VenUserButton } from '@/components/ven-user-button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-5 flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <div className="text-2xl sm:text-3xl font-bold truncate">
              Ven<span className="text-[#22c55e]">Shares</span>
            </div>
            <div className="text-sm text-slate-500 hidden md:block shrink-0">Where Ideas Meet Action</div>
          </div>

          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium shrink-0">
            <Link href="#how-it-works" className="hover:text-[#22c55e] transition-colors">How it Works</Link>
            <Link href="#inventors" className="hover:text-[#22c55e] transition-colors">For Inventors</Link>
            <Link href="#professionals" className="hover:text-[#22c55e] transition-colors">For Professionals</Link>
            <Show when="signed-out">
              <SignInButton mode="modal"><button type="button" className="ven-cta text-sm px-6 lg:px-8 py-3">Login</button></SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/idea-arena" className="text-slate-700 hover:text-[#22c55e] transition-colors">
                Idea Arena
              </Link>
              <Link href="/dashboard" className="ven-cta text-sm px-6 lg:px-8 py-3">Dashboard</Link>
              <VenUserButton />
            </Show>
          </div>

          <details className="md:hidden relative shrink-0 text-sm">
            <summary className="list-none cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-800 shadow-sm hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-lg flex flex-col gap-1">
              <Link href="#how-it-works" className="rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-50 hover:text-[#22c55e]">
                How it Works
              </Link>
              <Link href="#inventors" className="rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-50 hover:text-[#22c55e]">
                For Inventors
              </Link>
              <Link href="#professionals" className="rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-50 hover:text-[#22c55e]">
                For Professionals
              </Link>
              <div className="mt-2 border-t border-slate-100 pt-2 flex flex-col gap-2">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button type="button" className="ven-cta w-full text-sm px-4 py-2.5 text-center">
                      Login
                    </button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <Link href="/idea-arena" className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-[#22c55e]">
                    Idea Arena
                  </Link>
                  <Link href="/dashboard" className="ven-cta block text-center text-sm px-4 py-2.5">
                    Dashboard
                  </Link>
                  <div className="flex justify-center pt-1">
                    <VenUserButton />
                  </div>
                </Show>
              </div>
            </div>
          </details>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-bg h-screen flex items-center justify-center text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-white">
            If you find a job you love,<br />
            you&apos;ll never work again...
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-12 max-w-2xl mx-auto">
            VenShares connects skilled professionals with inventors to build businesses together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup/inventor" className="ven-cta text-lg px-12 py-4">
              Get Started as Inventor
            </Link>
            <Link href="/auth/signup/professional" className="border-2 border-white text-white hover:bg-white hover:text-slate-900 text-lg px-12 py-4 rounded-full transition-all">
              Join as Professional
            </Link>
          </div>
        </div>
      </section>

      {/* How Does VenShares Work? – Exact Flow from PDF */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4">How Does VenShares Work?</h2>
            <p className="text-xl text-slate-600">From idea to thriving business — together.</p>
          </div>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-3">An Inventor Submits an Idea</h3>
                <p className="text-slate-600">Bring your idea to VenShares. Bring your idea to life.</p>
              </div>
              <div className="step-box w-full max-w-xs">
                💡 Inventor with lightbulb → Computer screen
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 md:text-right">
                <h3 className="text-2xl font-semibold mb-3">Skilled Professionals check IP and viability of the idea.</h3>
                <p className="text-slate-600">Is it feasible? Can it be protected? Does it already exist?</p>
              </div>
              <div className="step-box w-full max-w-xs">
                👥 Team reviewing documents with checkmarks
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-3">Skilled Professionals Join Project Team</h3>
                <p className="text-slate-600">Contribute to an idea!</p>
              </div>
              <div className="step-box w-full max-w-xs">
                🔄 Team collaboration circle
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 md:text-right">
                <h3 className="text-2xl font-semibold mb-3">Submit it to crowd funding section of VenShares</h3>
                <p className="text-slate-600">This will test for market acceptance</p>
              </div>
              <div className="step-box w-full max-w-xs">
                💰 FUNDED! Network with dollar signs
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-3">Product is Built and launched</h3>
              </div>
              <div className="step-box w-full max-w-xs">🚀 Launch icon</div>
            </div>

            {/* Step 6 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 md:text-right">
                <h3 className="text-2xl font-semibold mb-3">The Idea Becomes a Thriving Business</h3>
              </div>
              <div className="step-box w-full max-w-xs">📊 Cash register + growth chart</div>
            </div>

            {/* Final Earn Section */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-3">Earn Shares / dividends based on your contributions</h3>
              </div>
              <div className="step-box w-full max-w-xs">📈 Growth arrow chart</div>
            </div>
          </div>
        </div>
      </section>

      {/* For Inventors Section */}
      <section id="inventors" className="section-inventor py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-semibold mb-6">Inventors</h2>
            <p className="text-lg text-slate-700 leading-relaxed">
              Have you ever had an idea but didn&apos;t have time, experience and resources to bring it to market?<br /><br />
              At VenShares, we have skilled professionals ready to invest their time in your project in return for shares in the new company.<br /><br />
              Get your idea out of the drawer and off the ground!
            </p>
            <Link href="/auth/signup/inventor" className="ven-cta inline-block mt-8">
              Join as Inventor
            </Link>
          </div>
          <div className="flex justify-center">
            👤 Person with lightbulb icon (green circle)
          </div>
        </div>
      </section>

      {/* For Skilled Professionals Section */}
      <section id="professionals" className="section-professional py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            👥 Team collaboration circle with arrows
          </div>
          <div>
            <h2 className="text-3xl font-semibold mb-6">Skilled Professionals</h2>
            <p className="text-lg text-slate-700 leading-relaxed">
              Are you a ready to earn ownership shares in a company?<br />
              Scroll through invention projects and get inspired.<br /><br />
              Join a team that needs your skills and start earning! Your spare time – even 4 hours each week – could be worth over $65,000 in the next 5 years!<br /><br />
              Give your future self the gift of a stock portfolio.
            </p>
            <Link href="/auth/signup/professional" className="ven-cta inline-block mt-8">
              Join VenShares!
            </Link>
          </div>
        </div>
      </section>

      {/* Earnings Bar Chart Teaser */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-sky-50 p-8 rounded-3xl">
            <p className="text-lg font-medium mb-6">
              Using half of the free time that you now spend on Social Media could earn you ownership shares in new companies and lasting financial stability.
            </p>
            <div className="h-64 bg-white rounded-2xl flex items-end justify-around p-8 gap-4">
              {/* Simple visual bar chart placeholder */}
              <div className="flex-1 bg-slate-300 h-8 rounded"></div>
              <div className="flex-1 bg-emerald-400 h-20 rounded"></div>
              <div className="flex-1 bg-emerald-500 h-32 rounded"></div>
              <div className="flex-1 bg-emerald-600 h-44 rounded"></div>
              <div className="flex-1 bg-emerald-700 h-56 rounded"></div>
              <div className="flex-1 bg-emerald-600 h-[280px] rounded font-bold text-white flex items-end justify-center pb-2">Total</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12 text-center text-sm">
        <p>Copyright VenShares 2020 - 2026</p>
        <p className="mt-2">Contact Us</p>
      </footer>
    </div>
  );
}