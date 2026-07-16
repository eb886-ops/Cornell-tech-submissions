import { Link } from "wouter";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPinned, TrainFront, Radio } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="relative min-h-[560px] flex items-end">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-skyline.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        <div className="relative max-w-5xl mx-auto px-5 pb-16 pt-32 w-full">
          <p className="text-sm uppercase tracking-[0.15em] text-white/70 mb-3" data-testid="text-hero-kicker">
            Five people, four boroughs, one fair spot
          </p>
          <h1
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-[1.05] max-w-2xl"
            data-testid="text-hero-headline"
          >
            Stop letting whoever's closest pick where everyone meets.
          </h1>
          <p className="text-white/80 text-base mt-5 max-w-lg" data-testid="text-hero-subhead">
            Drop in real addresses, weigh in each person's chance of running late, and compare driving against the
            subway using live MTA service alerts — not guesswork.
          </p>
          <Link href="/planner">
            <Button size="lg" className="mt-7 gap-2" data-testid="button-hero-cta">
              Plan a meetup <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works — asymmetric split */}
      <section className="max-w-5xl mx-auto px-5 py-20 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div className="flex flex-col gap-8">
          <h2 className="font-serif text-2xl" data-testid="text-how-heading">
            Built on the routes that actually exist
          </h2>
          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <MapPinned className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Type an address, not a neighborhood</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Autocomplete finds the exact building, then geocodes it precisely — the same way a mapping app
                  would.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <TrainFront className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Driving or subway — your call</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Every person gets a driving estimate and a walk-to-station-plus-subway estimate built from the
                  real subway map, not straight-line guesses.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Radio className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Live service alerts count against the score</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Active MTA delays and suspensions on a person's line push their estimate up, so the fairest spot
                  reflects what's happening on the tracks right now.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-md overflow-hidden">
          <img
            src="/images/subway-station-14st.jpg"
            alt="14th Street subway platform with an arriving train"
            className="w-full h-[420px] object-cover"
            data-testid="img-subway-station"
          />
        </div>
      </section>

      {/* Fairness banner */}
      <section className="relative min-h-[320px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/subway-platform.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative max-w-3xl mx-auto px-5 py-16 text-center">
          <p className="font-serif text-xl sm:text-2xl text-white leading-snug" data-testid="text-fairness-quote">
            "Best overall" and "most fair" aren't always the same spot. We track both, so nobody quietly eats a
            40-minute commute every time.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-5 py-20 flex flex-col items-start gap-4">
        <h2 className="font-serif text-2xl" data-testid="text-final-heading">
          Herald Square, Union Square, World Trade Center, or Atlantic Terminal.
        </h2>
        <p className="text-muted-foreground max-w-lg">
          Four fixed meetup spots across Manhattan and Brooklyn. Add your group and see which one actually makes
          sense today.
        </p>
        <Link href="/planner">
          <Button size="lg" className="mt-2 gap-2" data-testid="button-final-cta">
            Start planning <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-card-border py-8">
        <div className="max-w-5xl mx-auto px-5 text-xs text-muted-foreground flex flex-wrap gap-x-2">
          <span>Routing by Mapbox.</span>
          <span>Live service alerts and subway data from the MTA.</span>
        </div>
      </footer>
    </div>
  );
}
