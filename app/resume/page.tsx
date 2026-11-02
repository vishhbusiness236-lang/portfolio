import PrintButton from "@/components/PrintButton";

export const metadata = { title: "Vishesh Meena • Resume" };

const Sec = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <section className="mt-6">
    <h2 className="border-b border-[#d8cfbd] pb-1 text-xs font-semibold uppercase tracking-widest text-[#b4442c]">
      {t}
    </h2>
    <div className="mt-3 space-y-3 text-[14px] leading-6">{children}</div>
  </section>
);

export default function Resume() {
  return (
    <div className="scroll-page">
      <div className="mx-auto max-w-[800px] px-8 py-10">
        <div className="no-print mb-6 flex items-center justify-between">
          <a href="/" className="text-sm text-[#b4442c] underline">
            ← Back to the room
          </a>
          <PrintButton />
        </div>

        <header>
          <h1 className="serif text-5xl">Vishesh Meena</h1>
          <p className="mt-1 text-[15px] text-[#47423a]">
            Self-taught solo founder and developer · Sawai Madhopur, Rajasthan, India
          </p>
          <p className="mt-1 text-[13px] text-[#47423a]">
            vishhbusiness236@gmail.com · x.com/Visheshmeena23 ·
            github.com/vishhbusiness236-lang · kratoai.vercel.app
          </p>
        </header>

        <Sec t="Summary">
          <p>
            Solo founder who has shipped 8 products in about 14 months without
            formal training. Currently building Krato, an AI QA tool for solo
            developers. Comfortable owning a product end to end: idea, full
            stack build, deployment, and talking to users.
          </p>
        </Sec>

        <Sec t="Projects">
          <div>
            <div className="font-semibold">Krato · AI QA scanning tool · kratoai.vercel.app</div>
            <ul className="list-disc pl-5">
              <li>Explores a site in a real browser (Playwright, Chromium) in four modes: happy path, edge case, adversarial, security.</li>
              <li>Accessibility (axe-core), Core Web Vitals, regression diffing between scans, AI-written fix suggestions.</li>
              <li>Linear and GitHub OAuth integrations, public report links, PDF export, CLI and CI support.</li>
              <li>Next.js, Supabase (Postgres, RLS, Auth), Groq, Vercel. 10 signups and 50 scans so far.</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">FindTeamo · hackathon teammate matching · findteamo.vercel.app</div>
            <ul className="list-disc pl-5">
              <li>Swipe-based matching, real-time chat with image and voice, onboarding enforced in middleware, RLS on every table.</li>
              <li>Next.js, TypeScript, Supabase Realtime and Storage. Submitted to Hack Club with 35+ Hackatime hours.</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">Roast My Website · roastmy-website.vercel.app</div>
            <ul className="list-disc pl-5">
              <li>URL in, screenshot and blunt AI teardown out. Playwright and Groq on Vercel.</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">Smriti · voice memory preservation</div>
            <ul className="list-disc pl-5">
              <li>Records conversations with elderly family members, transcribes with Groq Whisper, turns them into story beats with Gemini. Qualified for the USAII Global AI Hackathon 2026 (80/100).</li>
            </ul>
          </div>
          <p>
            Also shipped: Verba (AI podcast trainer, Android app via Capacitor),
            Lyrova (AI music producer), CareAlong (family care coordination),
            TogetherHeal (emotional support platform).
          </p>
        </Sec>

        <Sec t="Achievements">
          <ul className="list-disc pl-5">
            <li>Winner, DSH Hacks V1</li>
            <li>Winner, TechCommons Hacks</li>
            <li>Qualified, USAII Global AI Hackathon 2026</li>
            <li>Completed YC Startup School. Active in Hack Club (Macondo, Horizons, YSWS).</li>
          </ul>
        </Sec>

        <Sec t="Skills">
          <p>
            Next.js, React, TypeScript, Tailwind, Supabase and PostgreSQL (RLS,
            auth, realtime), Playwright, OAuth (Linear, GitHub), Groq and Gemini
            APIs, Vercel.
          </p>
        </Sec>
      </div>
    </div>
  );
}