import { ArrowUpRight, Play } from 'lucide-react';

type ResponsiveHeroBannerProps = {
  badgeLabel: string;
  badgeText: string;
  title: string;
  titleLine2: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  ctaButtonText: string;
  partnersTitle: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onCtaAction?: () => void;
};

const partners = ['Nova', 'Forge', 'Flux', 'Beryl', 'echo'];

export default function ResponsiveHeroBanner({
  badgeLabel,
  badgeText,
  title,
  titleLine2,
  description,
  primaryButtonText,
  secondaryButtonText,
  ctaButtonText,
  partnersTitle,
  onPrimaryAction,
  onSecondaryAction,
  onCtaAction,
}: ResponsiveHeroBannerProps) {
  return (
    <section className="responsive-hero" aria-labelledby="responsive-hero-title">
      <div className="responsive-hero-orbit" aria-hidden="true" />
      <div className="responsive-hero-glow" aria-hidden="true" />
      <div className="responsive-hero-inner">
        <nav className="responsive-hero-nav" aria-label="Space travel navigation">
          <a className="responsive-hero-logo" href="#dashboard" aria-label="Orbi home">Orbi</a>
          <div className="responsive-hero-links">
            <a href="#dashboard">Home</a>
            <a href="#missions">Missions</a>
            <a href="#destinations">Destinations</a>
            <a href="#technology">Technology</a>
            <a href="#flight">Book Flight</a>
          </div>
          <button className="responsive-hero-nav-cta" type="button" onClick={onCtaAction}>{ctaButtonText}<ArrowUpRight size={13} /></button>
        </nav>

        <div className="responsive-hero-content">
          <div className="responsive-hero-badge"><strong>{badgeLabel}</strong><span>{badgeText}</span></div>
          <h1 id="responsive-hero-title">{title}<br /><em>{titleLine2}</em></h1>
          <p>{description}</p>
          <div className="responsive-hero-actions">
            <button className="responsive-hero-primary" type="button" onClick={onPrimaryAction}>{primaryButtonText}<ArrowUpRight size={14} /></button>
            <button className="responsive-hero-secondary" type="button" onClick={onSecondaryAction}><Play size={12} fill="currentColor" />{secondaryButtonText}</button>
          </div>
        </div>

        <div className="responsive-hero-partners" id="partners">
          <p>{partnersTitle}</p>
          <div className="responsive-hero-partner-list" aria-label="Partner agencies">
            {partners.map(partner => <span key={partner}>{partner}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}
