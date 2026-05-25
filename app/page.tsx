import Image from 'next/image';
import Link from 'next/link';
import { Show, SignInButton } from '@clerk/nextjs';

import { VenSharesLogo } from '@/components/venshares-logo';
import { VenUserButton } from '@/components/ven-user-button';

const NAV_LINKS = [
  { label: 'INVENT', href: '#inventors' },
  { label: 'EARN', href: '#professionals' },
  { label: 'INVEST', href: '#how-it-works' },
] as const;

type HowItWorksStep = {
  title: string;
  caption?: string;
  image?: string;
  imageAlt?: string;
  yesAfter?: boolean;
};

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'An Inventor Submits an Idea',
    image: '/assets/landing-how-step-01.png',
    imageAlt: 'Inventor with lightbulb submitting an idea to the VenShares dashboard',
  },
  {
    title: 'Skilled Professionals check IP and viability of the idea.',
    caption: 'Is it feasible? Can it be protected? does it already exist? etc…',
    image: '/assets/landing-how-step-02.png',
    imageAlt: 'Skilled professionals reviewing IP and viability of an idea',
    yesAfter: true,
  },
  {
    title: 'Skilled Professionals Join Project Team',
    caption: 'Contribute to an Idea!',
    image: '/assets/landing-how-step-03.png',
    imageAlt: 'Professionals collaborating on a project team',
    yesAfter: true,
  },
  {
    title: 'Submit it to crowd funding section of VenShares',
    caption: 'This will test for market acceptance',
    image: '/assets/landing-how-step-04.png',
    imageAlt: 'Crowdfunding section showing FUNDED status',
  },
  {
    title: 'Product is Built and launched',
    image: '/assets/landing-how-step-05.png',
    imageAlt: 'Product build and launch',
  },
  {
    title: 'The Idea Becomes a Thriving Business',
    image: '/assets/landing-how-step-06.png',
    imageAlt: 'Thriving business growth',
  },
  {
    title: 'Earn Shares / dividends based on your contributions',
    image: '/assets/landing-how-step-07.png',
    imageAlt: 'Earn shares and dividends based on your contributions',
  },
];

function LandingNavLinks({ className = '' }: { className?: string }) {
  return (
    <>
      {NAV_LINKS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`hover:text-[#22c55e] transition-colors ${className}`.trim()}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-5 flex items-center justify-between gap-3 min-w-0">
          <VenSharesLogo priority />

          <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 text-xs font-medium tracking-wide text-slate-900 flex-1">
            <LandingNavLinks />
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button type="button" className="text-sm font-medium text-slate-800 hover:text-[#22c55e] transition-colors px-2">
                  LOGIN
                </button>
              </SignInButton>
              <Link href="/auth/signup" className="ven-cta text-sm px-6 lg:px-8 py-3">
                JOIN
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/idea-arena" className="text-sm font-medium text-slate-700 hover:text-[#22c55e] transition-colors">
                Idea Arena
              </Link>
              <Link href="/dashboard" className="ven-cta text-sm px-6 lg:px-8 py-3">
                Dashboard
              </Link>
              <VenUserButton />
            </Show>
          </div>

          <details className="md:hidden relative shrink-0 text-sm">
            <summary className="list-none cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-800 shadow-sm hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-lg flex flex-col gap-1">
              <LandingNavLinks className="rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-50 hover:text-[#22c55e]" />
              <div className="mt-2 border-t border-slate-100 pt-2 flex flex-col gap-2">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button type="button" className="rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-50 hover:text-[#22c55e] w-full text-left">
                      LOGIN
                    </button>
                  </SignInButton>
                  <Link href="/auth/signup" className="ven-cta block text-center text-sm px-4 py-2.5">
                    JOIN
                  </Link>
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
      <section className="hero-bg h-[25vh] flex items-center justify-center text-center px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="hero-quote">
            If you find a job you love, you&apos;ll never work again.
          </h1>
        </div>
      </section>

      {/* How It Works — vertical flow from LandingPage v4 */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="how-it-works-heading">
            How does VenShares work
          </h2>
          <div className="space-y-12">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.title}>
                <div className="how-step grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                  <div className="how-step-text">
                    <h3 className="how-step-title">{step.title}</h3>
                    {step.caption && (
                      <p className="how-step-caption">{step.caption}</p>
                    )}
                  </div>
                  {step.image && (
                    <div className="how-step-panel">
                      <Image
                        src={step.image}
                        alt={step.imageAlt ?? step.title}
                        width={1200}
                        height={800}
                        className="how-step-image"
                        sizes="(max-width: 768px) 100vw, 896px"
                      />
                    </div>
                  )}
                </div>
                {step.yesAfter && (
                  <div className="how-step-yes" aria-label="Approved">
                    Yes!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Inventors Section */}
      <section id="inventors" className="section-inventor py-20 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-semibold mb-6">Inventors</h2>
            <p className="text-lg text-slate-700 leading-relaxed">
              Have you ever had an idea but didn&apos;t have time, experience and resources to bring it to market?<br /><br />
              At VenShares, we have skilled professionals ready to invest their time in your project in return for shares in the new company.<br /><br />
              Get your idea out of the drawer and off the ground!
            </p>
            <Link href="/auth/signup/inventor" className="ven-cta inline-block mt-8">
              Join
            </Link>
          </div>
          <div className="flex justify-center">
            <Image
              src="/assets/landing-inventor-illustration.png"
              alt="Inventor with a new idea"
              width={672}
              height={730}
              className="w-full max-w-sm h-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* For Skilled Professionals Section */}
      <section id="professionals" className="section-professional py-20 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center order-2 md:order-1">
            <Image
              src="/assets/landing-professionals-illustration.png"
              alt="Skilled professionals contributing to an idea"
              width={900}
              height={1250}
              className="w-full max-w-md h-auto object-contain"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-semibold mb-6">Skilled Professionals</h2>
            <p className="text-lg text-slate-700 leading-relaxed">
              Are you a ready to earn ownership shares in a company?<br />
              Scroll through invention projects and get inspired.<br /><br />
              Join a team that needs your skills and start earning! Your spare time – even 4 hours each week – could be worth $65,000 annually over the next 5 years.<br /><br />
              Give your future self the gift of a stock portfolio!
            </p>
            <Link href="/auth/signup/professional" className="ven-cta inline-block mt-8">
              Join VenShares!
            </Link>
          </div>
        </div>
      </section>

      {/* Earnings Bar Chart */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-6">
            Skilled Professionals:
          </h2>
          <p className="text-lg font-medium text-slate-700 mb-8 max-w-3xl mx-auto">
            Using half of the free time that you now spend on Social Media could earn you ownership shares in new companies and lasting financial stability.
          </p>
          <Image
            src="/assets/landing-earnings-chart.png"
            alt="Comparison of earnings from regular job overtime versus VenShares projects over five years"
            width={1850}
            height={834}
            className="w-full h-auto rounded-2xl"
            sizes="(max-width: 768px) 100vw, 896px"
          />
          <Link href="/auth/signup/professional" className="ven-cta inline-block mt-10">
            Join VenShares!
          </Link>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12 text-center text-sm">
        <p>Copyright VenShares 2020 - 2026</p>
        <p className="mt-2">Contact Us</p>
      </footer>
    </div>
  );
}
