import { CONTENT } from "@/lib/content";

export const metadata = { title: "Vishesh Meena • Portfolio (plain version)" };

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="serif mb-4 mt-14 text-4xl">{children}</h2>
);

export default function Plain() {
  return (
    <div className="scroll-page">
      <main className="mx-auto max-w-2xl px-6 py-16 text-[17px] leading-8 text-[#3a362e]">
        <a href="/" className="text-sm text-[#b4442c] underline">
          ← Back to the 3D room
        </a>
        <h1 className="serif mt-6 text-6xl text-[#1b1a17]">Vishesh Meena</h1>
        <p className="serif mt-2 text-2xl italic">
          Self-taught solo founder, building Krato.
        </p>
        <p className="mt-6">
          I&apos;m from Sawai Madhopur, Rajasthan, India. In about 14 months I
          have shipped 8 products and won 2 hackathons.
        </p>

        <H>Krato</H>
        <p>
          An AI QA tool for solo developers. You paste a URL, Krato opens your
          site in a real browser, explores it, and reports what is broken with a
          suggested fix for each issue. It checks accessibility (WCAG),
          performance (Core Web Vitals), compares scans to find regressions, and
          connects to Linear, GitHub and CI.
        </p>
        <p className="mt-4">
          Status: about 3 to 4 months old, 10 signups and 50 scans so far. No
          paying users yet.
        </p>
        <p className="mt-4">
          <a className="text-[#b4442c] underline" href="https://kratoai.vercel.app">
            Try Krato
          </a>{" "}
          ·{" "}
          <a
            className="text-[#b4442c] underline"
            href="https://github.com/vishhbusiness236-lang/krato"
          >
            Source
          </a>
        </p>

        <H>Other work</H>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <a className="text-[#b4442c] underline" href="https://findteamo.vercel.app">
              FindTeamo
            </a>
            : hackathon teammate and co-founder matching with real-time chat.
          </li>
          <li>
            <a
              className="text-[#b4442c] underline"
              href="https://roastmy-website.vercel.app"
            >
              Roast My Website
            </a>
            : paste a URL, get a blunt teardown with a screenshot.
          </li>
          <li>Smriti: voice conversations with family turned into stories. USAII Global AI Hackathon 2026 qualifier.</li>
          <li>
            <a className="text-[#b4442c] underline" href="https://verbaa-ai.lovable.app">
              Verba
            </a>
            : AI podcast trainer.
          </li>
          <li>Lyrova, CareAlong, TogetherHeal.</li>
        </ul>

        <H>Wins and programs</H>
        <p>
          Winner at DSH Hacks V1 and TechCommons Hacks. YC Startup School
          completed. Active in Hack Club.
        </p>

        <H>Goals</H>
        <ul className="list-disc space-y-2 pl-6">
          {CONTENT.goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>

        <H>Contact</H>
        <p>
          <a className="text-[#b4442c] underline" href="mailto:vishhbusiness236@gmail.com">
            vishhbusiness236@gmail.com
          </a>{" "}
          ·{" "}
          <a className="text-[#b4442c] underline" href="https://x.com/Visheshmeena23">
            X
          </a>{" "}
          ·{" "}
          <a
            className="text-[#b4442c] underline"
            href="https://github.com/vishhbusiness236-lang"
          >
            GitHub
          </a>{" "}
          ·{" "}
          <a className="text-[#b4442c] underline" href="/resume">
            Resume
          </a>
        </p>
      </main>
    </div>
  );
}