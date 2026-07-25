import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Pill,
  Languages,
  ShieldCheck,
  Sparkles,
  Upload,
  ScanLine,
  MessagesSquare,
  Lock,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const features = [
  {
    icon: FileText,
    title: "Report analysis",
    body: "Blood, urine, and lab reports parsed into test-by-test explanations with color-coded ranges.",
  },
  {
    icon: Pill,
    title: "Prescription reader",
    body: "OCR + AI reads handwritten prescriptions. Never guesses — flags low-confidence medicines.",
  },
  {
    icon: Languages,
    title: "Multilingual",
    body: "Every explanation and instruction available in English, Hindi, and Bengali.",
  },
  {
    icon: Stethoscope,
    title: "Doctor-ready questions",
    body: "Generates a focused list of questions to bring to your next appointment.",
  },
  {
    icon: MessagesSquare,
    title: "Ask about your report",
    body: "Chat with AI using your uploaded report as context. Educational, never diagnostic.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Your files are scoped to your account with row-level security. You control deletion.",
  },
];

const steps = [
  { icon: Upload, title: "Upload", body: "Drop a PDF or photo of your report or prescription." },
  {
    icon: ScanLine,
    title: "Extract",
    body: "OCR reads printed and handwritten text with confidence scores.",
  },
  {
    icon: Sparkles,
    title: "Explain",
    body: "AI turns medical jargon into simple, actionable language.",
  },
];

const testimonials = [
  {
    name: "Priya S.",
    role: "Software engineer, Bengaluru",
    quote:
      "I finally understood what my thyroid panel actually meant. The doctor-question list was gold at my next visit.",
  },
  {
    name: "Arjun M.",
    role: "Caregiver for elderly parent",
    quote:
      "Reading my father's handwritten prescriptions used to be impossible. Now I get a clear schedule and dosage list.",
  },
  {
    name: "Nandini R.",
    role: "Graduate student",
    quote:
      "The Bengali translations helped my grandmother understand her own report for the first time.",
  },
];

const faqs = [
  {
    q: "Is this a replacement for a doctor?",
    a: "No. MediExplain AI is strictly educational. It helps you understand terminology and prepare better questions — always consult a qualified healthcare professional for diagnosis or treatment.",
  },
  {
    q: "What files can I upload?",
    a: "PDF, PNG, JPG, JPEG, and WEBP. Reports are enhanced (denoise, contrast, sharpen) before OCR for better accuracy.",
  },
  {
    q: "What happens if handwriting is unclear?",
    a: "We never guess. Low-confidence sections are shown as 'possible' with a confidence score and alternatives, along with a prompt to verify with your doctor or pharmacist.",
  },
  {
    q: "Which languages are supported?",
    a: "English, Hindi, and Bengali — for both explanations and medicine instructions.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Every file and analysis is scoped to your account via row-level security. You can delete your history at any time.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Privacy />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Stethoscope className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">MediExplain AI</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#privacy" className="transition-colors hover:text-foreground">
            Privacy
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,oklch(0.5_0.05_200/0.15)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Educational AI — never diagnostic
          </div>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Understand your medical reports{" "}
            <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
              in seconds
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Upload reports or handwritten prescriptions and receive AI-powered explanations in
            simple language — in English, Hindi, or Bengali.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6 shadow-[var(--shadow-glow)]">
              <Link to="/auth">
                <Upload className="mr-2 h-4 w-4" />
                Upload report
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link to="/auth">
                Try demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            No credit card. Your files are private and deletable at any time.
          </p>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <div className="relative rounded-3xl border border-border/70 bg-card p-2 shadow-[var(--shadow-glow)]">
        <div className="rounded-2xl border border-border/60 bg-background p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Blood report · CBC panel
            </div>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
              Analyzed
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { name: "Hemoglobin", value: "10.2 g/dL", status: "Low", tone: "warning" },
              { name: "WBC count", value: "7,400 /µL", status: "Normal", tone: "success" },
              { name: "Platelets", value: "155k /µL", status: "Normal", tone: "success" },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-border/70 bg-card p-4">
                <div className="text-xs text-muted-foreground">{t.name}</div>
                <div className="mt-1 text-lg font-semibold">{t.value}</div>
                <div
                  className={
                    "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                    (t.tone === "warning"
                      ? "bg-warning/15 text-warning"
                      : "bg-success/15 text-success")
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {t.status}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground/90">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI explanation
            </div>
            Your hemoglobin is slightly below the typical range. Common educational reasons include
            low iron intake or recent blood loss. Consider discussing with your doctor whether an
            iron panel or dietary review would help.
          </div>
        </div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeader
        eyebrow="Features"
        title="Everything you need to make sense of medical paperwork"
        subtitle="Purpose-built for patients and caregivers — not clinicians."
      />
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <Card
            key={title}
            className="group relative overflow-hidden rounded-2xl border-border/70 bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="border-y border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader eyebrow="How it works" title="Three steps from upload to understanding" />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="absolute right-5 top-5 text-xs font-semibold text-muted-foreground/60">
                0{i + 1}
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Privacy() {
  const points = [
    "Row-level security scopes files to your account only",
    "No training on your reports — ever",
    "Delete any analysis in one click",
    "Educational only, never a substitute for professional advice",
  ];
  return (
    <section id="privacy" className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Lock className="h-3.5 w-3.5" /> Privacy
          </div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Your health data stays yours
          </h2>
          <p className="mt-4 text-muted-foreground">
            Medical data is sensitive. We built MediExplain with strict data isolation, minimal
            retention, and a clear line: we help you understand — we never diagnose.
          </p>
          <ul className="mt-6 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="text-foreground/90">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative rounded-3xl border border-border/70 bg-card p-8 shadow-[var(--shadow-soft)]">
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm leading-relaxed">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-warning">
              <ShieldCheck className="h-4 w-4" /> Disclaimer
            </div>
            This application is for educational purposes only and does not provide medical diagnosis
            or treatment. Always consult a qualified healthcare professional.
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <StatBlock label="Encryption" value="At rest & in transit" />
            <StatBlock label="Retention" value="Deletable anytime" />
            <StatBlock label="Access" value="Only you" />
            <StatBlock label="Purpose" value="Educational" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function Testimonials() {
  return (
    <section className="border-y border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader eyebrow="Loved by patients" title="Clarity, in their own words" />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card
              key={t.name}
              className="rounded-2xl border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]"
            >
              <p className="text-sm leading-relaxed text-foreground/90">“{t.quote}”</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-xs font-semibold text-primary-foreground">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <SectionHeader eyebrow="FAQ" title="Questions, answered" />
      <Accordion type="single" collapsible className="mt-10 w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={f.q} value={`item-${i}`} className="border-border/70">
            <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div
        className="relative overflow-hidden rounded-3xl border border-border/70 p-10 text-center shadow-[var(--shadow-glow)] md:p-16"
        style={{ background: "var(--gradient-hero)" }}
      >
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Start understanding your reports today
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Free to try. Educational only. Always consult your doctor for medical decisions.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-6 shadow-[var(--shadow-glow)]">
            <Link to="/auth">
              <Upload className="mr-2 h-4 w-4" /> Upload report
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-6">
            <Link to="/auth">
              Try demo <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[image:var(--gradient-primary)]">
            <Stethoscope className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="font-medium text-foreground">MediExplain AI</span>
          <span>· Educational use only</span>
        </div>
        <div className="flex items-center gap-6">
          <a className="hover:text-foreground" href="#privacy">
            Privacy
          </a>
          <a className="hover:text-foreground" href="#faq">
            FAQ
          </a>
          <a className="hover:text-foreground" href="#features">
            Features
          </a>
        </div>
      </div>
    </footer>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
