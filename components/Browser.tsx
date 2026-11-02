"use client";

import { useEffect, useRef, useState } from "react";
import { CONTENT } from "@/lib/content";

const SITE = "visheshmeena.vercel.app";

export type Page = "home" | "krato" | "work" | "about" | "contact";

const LINKS = {
  x: "https://x.com/Visheshmeena23",
  github: "https://github.com/vishhbusiness236-lang",
  mail: "mailto:vishhbusiness236@gmail.com",
  krato: "https://kratoai.vercel.app",
  kratoRepo: "https://github.com/vishhbusiness236-lang/krato",
  findteamo: "https://findteamo.vercel.app",
};

type Status = "Shipped" | "In progress" | "Planned";

const FEATURES: { name: string; desc: string; status: Status }[] = [
  {
    name: "Triaged reports",
    desc: "Issues are grouped and prioritised by rules, so two scans of the same site give consistent results.",
    status: "Shipped",
  },
  {
    name: "Four exploration styles",
    desc: "Happy Path, Edge Case, Adversarial and Security.",
    status: "Shipped",
  },
  {
    name: "Accessibility checks",
    desc: "WCAG checks with axe-core on every page it visits.",
    status: "Shipped",
  },
  {
    name: "Core Web Vitals",
    desc: "LCP, FCP, TTFB and CLS measured in the browser and graded against Google's thresholds.",
    status: "Shipped",
  },
  {
    name: "AI fix suggestions",
    desc: "Every issue comes with a suggested fix, shown in the dashboard and in the public report.",
    status: "Shipped",
  },
  {
    name: "Regression diffing",
    desc: "Compare a scan with the previous one: new, resolved and still-open issues.",
    status: "Shipped",
  },
  {
    name: "Public reports, PDF and badge",
    desc: "Share a report by link, export it as a PDF, or put a badge in your README.",
    status: "Shipped",
  },
  {
    name: "Linear and GitHub",
    desc: "Send findings to Linear or GitHub through OAuth.",
    status: "Shipped",
  },
  {
    name: "CLI and CI",
    desc: "Run scans from your pipeline with an API key and a small shell script.",
    status: "Shipped",
  },
  {
    name: "Session replay",
    desc: "Right now it is a single screenshot per issue. Multi-step replay is being built.",
    status: "In progress",
  },
  {
    name: "Scanning behind a login",
    desc: "Optional credentials so Krato can test pages that need an account.",
    status: "In progress",
  },
  {
    name: "Journey Discovery",
    desc: "Detect real user flows automatically, then walk through them. Detection works on regular sites; walking the flows is not built yet.",
    status: "In progress",
  },
  {
    name: "Scheduled scans with email alerts",
    desc: "Scheduling is set up. Email alerts are blocked until I can afford an email provider.",
    status: "Planned",
  },
];

const tagStyle: Record<Status, string> = {
  Shipped: "bg-[#dfe8d2] text-[#3f5f2e]",
  "In progress": "bg-[#f3e1b8] text-[#7a5a12]",
  Planned: "bg-[#e4ddd0] text-[#6a6355]",
};

function Note({ children }: { children: React.ReactNode }) {
  return (
    <span className="hand inline-block -rotate-2 text-2xl text-[#b4442c]">
      {children}
    </span>
  );
}

function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="serif mt-2 text-6xl leading-none text-[#1b1a17] sm:text-7xl">
      {children}
    </h1>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="hand mb-3 mt-16 text-3xl text-[#b4442c]">{children}</h2>;
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 max-w-2xl space-y-5 text-[18px] leading-8 text-[#3a362e]">
      {children}
    </div>
  );
}

function Btn({
  href,
  children,
  dark = true,
}: {
  href: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        dark
          ? "inline-block rounded-md bg-[#1b1a17] px-5 py-3 text-sm text-[#f4efe6] hover:bg-[#b4442c]"
          : "inline-block rounded-md border border-[#1b1a17] px-5 py-3 text-sm text-[#1b1a17] hover:border-[#b4442c] hover:text-[#b4442c]"
      }
    >
      {children}
    </a>
  );
}

function Row({
  title,
  children,
  href,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <div className="grid gap-1 border-t border-[#d8cfbd] py-5 sm:grid-cols-[210px_1fr] sm:gap-6">
      <div className="serif text-2xl text-[#1b1a17]">
        {title}
        {href && <span className="ml-1 text-base text-[#b4442c]">↗</span>}
      </div>
      <div className="text-[16px] leading-7 text-[#47423a]">{children}</div>
    </div>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block hover:bg-[#ece5d6]/60"
    >
      {inner}
    </a>
  ) : (
    inner
  );
}

function Feature({ f }: { f: (typeof FEATURES)[number] }) {
  return (
    <div className="grid gap-1 border-t border-[#d8cfbd] py-4 sm:grid-cols-[230px_1fr_auto] sm:items-baseline sm:gap-6">
      <div className="serif text-xl text-[#1b1a17]">{f.name}</div>
      <div className="text-[15px] leading-6 text-[#47423a]">{f.desc}</div>
      <span
        className={`w-fit rounded-full px-2.5 py-0.5 text-xs ${tagStyle[f.status]}`}
      >
        {f.status}
      </span>
    </div>
  );
}

function Home({ go }: { go: (p: Page) => void }) {
  const nav: { p: Page; t: string; d: string }[] = [
    { p: "krato", t: "Krato", d: "what I'm building now" },
    { p: "work", t: "Work", d: "8 products, 2 hackathon wins" },
    { p: "about", t: "About", d: "the story" },
    { p: "contact", t: "Contact", d: "email, X, GitHub" },
  ];
  return (
    <div>
      <Note>hi, welcome to my room</Note>
      <H1>Vishesh Meena</H1>
      <p className="serif mt-3 text-3xl italic text-[#47423a]">
        Self-taught solo founder, building Krato.
      </p>
      <Body>
        <p>
          I&apos;m from Sawai Madhopur, Rajasthan. Nobody taught me how to build
          products, I learned by shipping them. In about 14 months I&apos;ve
          released 8 products and won 2 hackathons.
        </p>
        <p>
          Right now I&apos;m building Krato, an AI QA tool for solo developers.
          It tests your website like a real user would, then tells you what is
          broken and how to fix it.
        </p>
      </Body>

      <div className="mt-8 flex flex-wrap gap-3">
        <Btn href={LINKS.krato}>Try Krato ↗</Btn>
        <button
          onClick={() => go("krato")}
          className="rounded-md border border-[#1b1a17] px-5 py-3 text-sm hover:border-[#b4442c] hover:text-[#b4442c]"
        >
          How Krato works →
        </button>
      </div>

      <div className="mt-12 max-w-2xl border-l-2 border-[#b4442c] pl-5">
        <div className="hand text-2xl text-[#b4442c]">right now</div>
        <p className="mt-1 text-[17px] leading-7 text-[#3a362e]">
          Working on Krato&apos;s Journey Discovery and looking for the first
          paying user.
        </p>
      </div>

      <div className="mt-14">
        {nav.map((n) => (
          <button
            key={n.p}
            onClick={() => go(n.p)}
            className="flex w-full items-baseline justify-between border-t border-[#d8cfbd] py-4 text-left hover:bg-[#ece5d6]/60"
          >
            <span className="serif text-3xl">{n.t}</span>
            <span className="text-sm text-[#6a6355]">
              {n.d} <span className="text-[#b4442c]">→</span>
            </span>
          </button>
        ))}
        <div className="border-t border-[#d8cfbd]" />
      </div>
    </div>
  );
}

function Krato() {
  return (
    <div>
      <Note>what I&apos;m building right now</Note>
      <H1>Krato</H1>
      <p className="serif mt-4 text-3xl italic text-[#47423a]">
        The tester I never had.
      </p>

      <Body>
        <p>
          Krato scans a website the way a real user would, finds what is broken
          and tells you how to fix it. It is built for solo developers who have
          no QA team and no time to click through their own app before every
          release.
        </p>
      </Body>

      <div className="mt-8 flex flex-wrap gap-3">
        <Btn href={LINKS.krato}>Try Krato ↗</Btn>
        <Btn href={LINKS.kratoRepo} dark={false}>
          Source on GitHub ↗
        </Btn>
      </div>

      <H2>the problem</H2>
      <div className="max-w-2xl space-y-4 text-[17px] leading-8 text-[#3a362e]">
        <p>
          Indie developers and small founders usually test their sites by hand,
          or not at all. The QA tools I tried were slow to set up and expensive
          for a one-person team.
        </p>
        <p>
          The real competitor is not another QA startup. It is a developer with
          Playwright, an AI coding agent and no idea what to test. Krato is a
          bet that deciding what to test is the hard part.
        </p>
      </div>

      <H2>how it works</H2>
      <div>
        <Row title="1. Paste a URL">
          Pick an exploration style: Happy Path, Edge Case, Adversarial or
          Security.
        </Row>
        <Row title="2. Krato explores">
          It opens your site in a real Chromium browser through Playwright,
          moves through pages and forms, and records errors, broken
          interactions, accessibility violations and performance numbers.
          Analytics and tracking noise is filtered out.
        </Row>
        <Row title="3. You get a triaged report">
          Issues are sorted by rules, so results stay consistent. An AI model
          (Groq) is used only for judgement calls and to write a suggested fix
          for each issue.
        </Row>
        <Row title="4. Share it or wire it in">
          Send a public report link, export a PDF, create Linear tickets or
          GitHub items, or run Krato from CI with an API key.
        </Row>
        <div className="border-t border-[#d8cfbd]" />
      </div>

      <H2>exploration styles</H2>
      <div>
        <Row title="Happy Path">Follows the main flows the way a normal user would.</Row>
        <Row title="Edge Case">Tries empty fields, odd inputs and unusual sequences.</Row>
        <Row title="Adversarial">Pushes on forms and flows to see what breaks.</Row>
        <Row title="Security">
          Basic application-level sanity checks. This is not a full security
          audit.
        </Row>
        <div className="border-t border-[#d8cfbd]" />
      </div>

      <H2>what is built, honestly</H2>
      <div>
        {FEATURES.map((f) => (
          <Feature key={f.name} f={f} />
        ))}
        <div className="border-t border-[#d8cfbd]" />
      </div>

      <H2>the part that matters most</H2>
      <div className="max-w-2xl space-y-4 text-[17px] leading-8 text-[#3a362e]">
        <p>
          Most scanners follow links. Real bugs hide in journeys: sign up, log
          in, add to cart, check out. Journey Discovery is my attempt to detect
          those flows automatically and then walk through them, so you
          don&apos;t have to tell the tool what matters.
        </p>
        <p>
          Today it detects flows on regular sites using heuristics plus an AI
          pass. On heavily bot-protected sites like Instagram or YouTube it
          returns nothing yet, and it does not walk the flows. That is the next
          piece.
        </p>
      </div>

      <H2>where it stands</H2>
      <div className="max-w-2xl border-l-2 border-[#b4442c] pl-5 text-[17px] leading-8 text-[#3a362e]">
        <p>
          Krato is about 3 to 4 months old. So far: 10 signups and 50 scans,
          mostly indie developers I found on X. Nobody is paying yet, and I
          would rather say that than hide it.
        </p>
      </div>

      <H2>built with</H2>
      <p className="max-w-2xl text-[16px] leading-7 text-[#47423a]">
        Next.js, Supabase (Postgres, row level security, auth), Playwright with
        Chromium, Groq, and Vercel.
      </p>

      <div className="mt-12 flex flex-wrap gap-3">
        <Btn href={LINKS.krato}>Try Krato ↗</Btn>
        <Btn href={LINKS.x} dark={false}>
          Send me feedback on X ↗
        </Btn>
      </div>
    </div>
  );
}

function Work() {
  return (
    <div>
      <Note>everything I&apos;ve shipped</Note>
      <H1>Work</H1>

      <div className="mt-10">
        <Row title="Krato" href={LINKS.krato}>
          AI QA scanning tool for solo developers. Explores your site in a real
          browser, checks accessibility and performance, suggests fixes, and
          plugs into Linear, GitHub and CI. My main project.
        </Row>
        <Row title="FindTeamo" href={LINKS.findteamo}>
          Hackathon teammate and co-founder matching. Swipe through profiles,
          chat in real time with images and voice, Supabase row level security
          on every table. Submitted to Hack Club with 35+ Hackatime hours. My
          most-used project so far.
        </Row>
        <Row title="Roast My Website" href="https://roastmy-website.vercel.app">
          Paste a URL and get a blunt teardown of your site, with a real
          screenshot. Built around a trending moment on X.
        </Row>
        <Row title="Smriti">
          Record voice conversations with elderly family members. AI
          transcribes them and turns them into story beats. Qualified for the
          USAII Global AI Hackathon 2026 with a score of 80/100.
        </Row>
        <Row title="Verba" href="https://verbaa-ai.lovable.app">
          AI podcast trainer, also packaged as an Android app with Capacitor.
        </Row>
        <Row title="Lyrova">AI music producer.</Row>
        <Row title="CareAlong">Family care coordination in one place.</Row>
        <Row title="TogetherHeal">Emotional support platform.</Row>
        <div className="border-t border-[#d8cfbd]" />
      </div>

      <H2>wins and programs</H2>
      <div>
        <Row title="DSH Hacks V1">Winner.</Row>
        <Row title="TechCommons Hacks">Winner.</Row>
        <Row title="USAII Global AI Hackathon 2026">Qualified with Smriti.</Row>
        <Row title="YC Startup School">Completed.</Row>
        <Row title="Hack Club">Active in Macondo, Horizons and YSWS.</Row>
        <div className="border-t border-[#d8cfbd]" />
      </div>
    </div>
  );
}

function AboutUnused() {
  return (
    <div>
      <Note>a bit about me</Note>
      <H1>About</H1>
      <Body>
        <p>
          I&apos;m Vishesh, a self-taught developer and solo founder from Sawai
          Madhopur, Rajasthan, India. I learned by building things and putting
          them in front of people, not from a course.
        </p>
        <p>
          My loop is simple: find a real problem, build the smallest version
          fast, show it to real users, then improve it. That loop produced 8
          products in about 14 months. Most of them are small. Krato is the one
          I&apos;m betting on.
        </p>
        <p>
          I build in public on X, and I&apos;m active in the Hack Club and Y
          Combinator communities.
        </p>
      </Body>

      <H2>outside the code</H2>
      <div>
        <Row title="Reading">There is a bookshelf in the room for a reason.</Row>
        <Row title="Music">
          The speakers on the desk work. Try clicking them.
        </Row>
        <Row title="Boxing">
          Gloves and a heavy bag are in the corner. Try punching it.
        </Row>
        <div className="border-t border-[#d8cfbd]" />
      </div>
    </div>
  );
}

function About() {
  return (
    <div>
      <Note>a bit about me</Note>
      <H1>About</H1>
      <Body>
        <p>
          I&apos;m Vishesh, a self-taught developer and solo founder from Sawai
          Madhopur, Rajasthan, India. I learned by building things and putting
          them in front of people, not from a course.
        </p>
        <p>
          My loop is simple: find a real problem, build the smallest version
          fast, show it to real users, then improve it. That loop produced 8
          products in about 14 months. Most of them are small. Krato is the one
          I&apos;m betting on.
        </p>
        <p>
          I build in public on X, and I&apos;m active in the Hack Club and Y
          Combinator communities.
        </p>
      </Body>

      {CONTENT.failure.story && (
        <>
          <H2>something that did not work</H2>
          <div className="max-w-2xl text-[17px] leading-8 text-[#3a362e]">
            <div className="serif mb-2 text-2xl">{CONTENT.failure.title}</div>
            <p>{CONTENT.failure.story}</p>
          </div>
        </>
      )}

      <H2>outside the code</H2>
      <div>
        <Row title="Reading">
          {CONTENT.nowReading
            ? `Right now: ${CONTENT.nowReading}.`
            : "There is a bookshelf in the room. Click it."}
        </Row>
        <Row title="Music">
          {CONTENT.nowListening
            ? `On repeat: ${CONTENT.nowListening}.`
            : "The speakers on the desk work. Click them."}
        </Row>
        <Row title="Boxing">
          {CONTENT.boxing ||
            "Gloves and a heavy bag are in the corner. Punch the bag, it swings."}
        </Row>
        <div className="border-t border-[#d8cfbd]" />
      </div>

      {CONTENT.books.length > 0 && (
        <>
          <H2>favourite books</H2>
          <div>
            {CONTENT.books.map((b) => (
              <Row key={b.title} title={b.title}>
                {b.by}
                {b.why ? `. ${b.why}` : ""}
              </Row>
            ))}
            <div className="border-t border-[#d8cfbd]" />
          </div>
        </>
      )}

      {CONTENT.songs.length > 0 && (
        <>
          <H2>favourite songs</H2>
          <div>
            {CONTENT.songs.map((s) => (
              <Row key={s.title} title={s.title}>
                {s.by}
                {s.why ? `. ${s.why}` : ""}
              </Row>
            ))}
            <div className="border-t border-[#d8cfbd]" />
          </div>
        </>
      )}
    </div>
  );
}

function Contact() {
  return (
    <div>
      <Note>let&apos;s talk</Note>
      <H1>Want to build something?</H1>
      <Body>
        <p>
          Feedback on Krato, a project idea, or just a hello. X and email get
          the fastest reply.
        </p>
        <p className="text-[16px] text-[#6a6355]">
          I&apos;m also looking for a co-founder who is strong at sales and
          creativity.
        </p>
      </Body>
      <div className="mt-10">
        <Row title="Email" href={LINKS.mail}>
          vishhbusiness236@gmail.com
        </Row>
        <Row title="X" href={LINKS.x}>
          @Visheshmeena23. I post what I&apos;m building there.
        </Row>
        <Row title="Resume" href="/resume">
          One page. Open it and save as PDF.
        </Row>
        <Row title="GitHub" href={LINKS.github}>
          vishhbusiness236-lang
        </Row>
        <div className="border-t border-[#d8cfbd]" />
      </div>
    </div>
  );
}

export default function Browser({
  onClose,
  initial = "home",
}: {
  onClose: () => void;
  initial?: Page;
}) {
  const [hist, setHist] = useState<Page[]>([initial]);
  const [i, setI] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const page = hist[i];

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [page]);

  const go = (p: Page) => {
    if (p === page) return;
    const h = [...hist.slice(0, i + 1), p];
    setHist(h);
    setI(h.length - 1);
  };

  const path = page === "home" ? "" : `/${page}`;
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#47423a] hover:bg-[#e3dccd] disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/35 p-0 sm:p-8">
      <div className="pop flex h-full max-h-[920px] w-full max-w-[1180px] flex-col overflow-hidden border border-black/40 bg-[#f4efe6] shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:rounded-xl">
        <div className="flex items-end gap-4 bg-[#d6cfbf] px-3 pt-2.5">
          <div className="mb-2 flex gap-2">
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-3 w-3 rounded-full bg-[#d9654f] hover:brightness-90"
            />
            <span className="h-3 w-3 rounded-full bg-[#d9b24f]" />
            <span className="h-3 w-3 rounded-full bg-[#7aa874]" />
          </div>
          <div className="flex max-w-[260px] items-center gap-2 rounded-t-lg bg-[#f4efe6] px-4 py-2 text-xs text-[#3a362e]">
            <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[#1b1a17] text-[10px] font-bold text-[#f4efe6]">
              V
            </span>
            <span className="truncate">Vishesh Meena • Portfolio</span>
          </div>
          <button
            onClick={onClose}
            className="mb-2 ml-auto text-xs text-[#6a6355] hover:text-[#b4442c]"
          >
            ← Back to room
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-[#d8cfbd] bg-[#f4efe6] px-3 py-2">
          <button className={btn} disabled={i === 0} onClick={() => setI(i - 1)}>
            ‹
          </button>
          <button
            className={btn}
            disabled={i >= hist.length - 1}
            onClick={() => setI(i + 1)}
          >
            ›
          </button>
          <button
            className={btn}
            onClick={() => scroller.current?.scrollTo({ top: 0, behavior: "smooth" })}
          >
            ↻
          </button>
          <div className="ml-2 flex flex-1 items-center gap-2 rounded-full bg-[#e9e3d6] px-4 py-1.5 text-[13px] text-[#47423a]">
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
              <rect x="1" y="5.5" width="9" height="7" rx="1.5" fill="#6a6355" />
              <path d="M3 5.5V4a2.5 2.5 0 0 1 5 0v1.5" stroke="#6a6355" strokeWidth="1.4" />
            </svg>
            <span className="truncate">
              <span className="text-[#8a8374]">https://</span>
              {SITE}
              <span className="text-[#8a8374]">{path}</span>
            </span>
          </div>
        </div>

        <div ref={scroller} className="paper-scroll flex-1 overflow-y-auto">
          <header className="border-b border-[#d8cfbd]">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 text-sm">
              <button onClick={() => go("home")} className="serif text-xl text-[#1b1a17]">
                vishesh meena
              </button>
              <nav className="flex gap-4 text-[#6a6355] sm:gap-5">
                {(["krato", "work", "about", "contact"] as Page[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => go(p)}
                    className={`capitalize hover:text-[#b4442c] ${
                      page === p ? "text-[#b4442c] underline underline-offset-4" : ""
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-3xl px-6 py-14">
            {page === "home" && <Home go={go} />}
            {page === "krato" && <Krato />}
            {page === "work" && <Work />}
            {page === "about" && <About />}
            {page === "contact" && <Contact />}
          </main>

          <footer className="mx-auto max-w-3xl border-t border-[#d8cfbd] px-6 py-8 text-xs text-[#8a8374]">
            © 2026 Vishesh Meena. Sawai Madhopur, Rajasthan, India.
          </footer>
        </div>
      </div>
    </div>
  );
}