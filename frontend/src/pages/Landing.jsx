import { Link } from "react-router-dom";
import { useReveal } from "../utils/useReveal";
import "./Landing.css";

const FEATURES = [
  {
    title: "Track every expense",
    description: "Log purchases in seconds with categories, dates, and notes so nothing slips through the cracks.",
    icon: "📝",
  },
  {
    title: "Edit anytime",
    description: "Made a mistake or need to update an amount? Edit any expense instantly, right from the dashboard.",
    icon: "✏️",
  },
  {
    title: "See where it goes",
    description: "Instant totals and category breakdowns show you exactly where your money is going, at a glance.",
    icon: "📊",
  },
  {
    title: "Your data, your device",
    description: "Everything is stored in your own local database — fast, private, and fully under your control.",
    icon: "🔒",
  },
];

const STEPS = [
  { step: "01", title: "Add an expense", description: "Enter a title, amount, category, and date." },
  { step: "02", title: "Track your spending", description: "Watch your totals and category breakdown update live." },
  { step: "03", title: "Stay in control", description: "Edit or delete entries whenever your spending changes." },
];

export default function Landing() {
  const featuresRef = useReveal();
  const stepsRef = useReveal();
  const ctaRef = useReveal();

  return (
    <div className="landing">
      <section className="hero">
        <div className="container hero-inner">
          <span className="hero-badge">Simple. Fast. Yours.</span>
          <h1 className="hero-title">
            Take control of your money,
            <br />
            one expense at a time.
          </h1>
          <p className="hero-subtitle">
            PennyWise is a clean, no-fuss expense tracker. Add what you spend, edit it whenever
            you need, and instantly see where your money goes.
          </p>
          <div className="hero-actions">
            <Link to="/dashboard" className="btn btn-primary hero-btn">
              Get Started — It's Free
            </Link>
          </div>
        </div>
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-glow-2" aria-hidden="true" />
      </section>

      <section className="container features reveal" ref={featuresRef}>
        <h2 className="section-title">Everything you need, nothing you don't</h2>
        <p className="section-subtitle">A focused toolset for staying on top of your spending.</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container steps reveal" ref={stepsRef}>
        <h2 className="section-title">How it works</h2>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step-card" key={s.step}>
              <span className="step-number">{s.step}</span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <div className="container cta-inner reveal" ref={ctaRef}>
          <h2>Ready to see where your money goes?</h2>
          <p>Open your dashboard and add your first expense in under a minute.</p>
          <Link to="/dashboard" className="btn btn-primary cta-btn">
            Open Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
