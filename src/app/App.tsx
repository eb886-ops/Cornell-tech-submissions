import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Star, MapPin, ChevronDown, X, BookOpen, Users, School, ArrowRight, Filter, Plus, ThumbsUp, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  author: string;
  school: string;
  date: string;
  rating: number;
  text: string;
  helpful: number;
}

interface Landlord {
  id: string;
  name: string;
  university: string;
  address: string;
  avgRating: number;
  reviewCount: number;
  reviews: Review[];
  tags: string[];
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const SCHOOLS = [
  "All Schools",
  "University of Michigan",
  "Ohio State University",
  "Penn State",
  "University of Wisconsin",
  "Indiana University",
  "Purdue University",
  "Michigan State",
  "University of Minnesota",
];

const LANDLORDS: Landlord[] = [
  {
    id: "1",
    name: "Greenfield Property Management",
    university: "University of Michigan",
    address: "412 S State St, Ann Arbor, MI 48109",
    avgRating: 4.2,
    reviewCount: 47,
    tags: ["Responsive", "Clean", "Fair Pricing"],
    reviews: [
      { id: "r1", author: "Emma R.", school: "University of Michigan", date: "Jan 2025", rating: 5, text: "Greenfield was one of the best landlord experiences I've had as a student. Maintenance requests were handled within 24 hours every single time, and the apartment was spotless when I moved in. They returned my full deposit with no questions asked.", helpful: 31 },
      { id: "r2", author: "Marcus T.", school: "University of Michigan", date: "Sep 2024", rating: 4, text: "Generally great management. The property is well-kept and they communicate clearly. Only complaint is that parking is a little tight but that's the neighborhood, not them.", helpful: 18 },
      { id: "r3", author: "Priya K.", school: "University of Michigan", date: "May 2024", rating: 4, text: "Really transparent lease terms, no hidden fees. Heat and hot water always worked. I'd rent from them again.", helpful: 22 },
    ],
  },
  {
    id: "2",
    name: "Campus Corner Rentals",
    university: "Ohio State University",
    address: "891 N High St, Columbus, OH 43201",
    avgRating: 2.3,
    reviewCount: 62,
    tags: ["Slow Repairs", "Security Deposit Issues"],
    reviews: [
      { id: "r4", author: "Jake W.", school: "Ohio State University", date: "Dec 2024", rating: 1, text: "Waited 6 weeks for a broken heater to be fixed in November. Completely unacceptable. They also tried to keep my deposit for 'normal wear and tear' on a 3-year-old carpet. Had to threaten small claims court.", helpful: 58 },
      { id: "r5", author: "Destiny L.", school: "Ohio State University", date: "Oct 2024", rating: 3, text: "Mixed experience. Location is great for campus access, but management is hard to reach. If everything goes smoothly you're fine; the moment something breaks it's a nightmare.", helpful: 29 },
      { id: "r6", author: "Tyler B.", school: "Ohio State University", date: "Aug 2024", rating: 2, text: "Multiple unannounced inspections during the lease. Felt really intrusive. The lease had a ton of vague clauses that seemed designed to withhold the security deposit.", helpful: 44 },
    ],
  },
  {
    id: "3",
    name: "Nittany Properties LLC",
    university: "Penn State",
    address: "247 E College Ave, State College, PA 16801",
    avgRating: 3.6,
    reviewCount: 38,
    tags: ["Average", "Decent Location"],
    reviews: [
      { id: "r7", author: "Sofia M.", school: "Penn State", date: "Feb 2025", rating: 4, text: "Solid mid-tier landlord. Nothing exceptional but nothing terrible. Maintenance is usually done within a week, which isn't great but isn't terrible. Price is reasonable for the area.", helpful: 14 },
      { id: "r8", author: "Connor F.", school: "Penn State", date: "Nov 2024", rating: 3, text: "Decent enough. The apartment was older but functional. They were slow to respond during game weekends — seems like they disappear during football season.", helpful: 9 },
    ],
  },
  {
    id: "4",
    name: "Lakeside Student Housing",
    university: "University of Wisconsin",
    address: "118 Langdon St, Madison, WI 53703",
    avgRating: 4.7,
    reviewCount: 29,
    tags: ["Excellent", "Pet Friendly", "Modern Units"],
    reviews: [
      { id: "r9", author: "Aisha D.", school: "University of Wisconsin", date: "Mar 2025", rating: 5, text: "Honestly the best landlord I've ever had. Super responsive, really kind, and the unit was absolutely gorgeous. They even brought flowers as a move-in gift. I cried a little when I moved out.", helpful: 67 },
      { id: "r10", author: "Leo V.", school: "University of Wisconsin", date: "Jan 2025", rating: 5, text: "My roommate and I have both rented from Lakeside for two years now. They're consistently excellent — fair, fast, and genuinely seem to care about tenants as people.", helpful: 41 },
      { id: "r11", author: "Nadia P.", school: "University of Wisconsin", date: "Aug 2024", rating: 4, text: "Really good experience overall. Minor point is that they're a bit strict about quiet hours policy, but honestly that's probably a positive for a study-focused tenant.", helpful: 19 },
    ],
  },
  {
    id: "5",
    name: "Hoosier Homes Management",
    university: "Indiana University",
    address: "302 E 3rd St, Bloomington, IN 47401",
    avgRating: 1.8,
    reviewCount: 74,
    tags: ["Avoid", "Mold Issues", "Unresponsive"],
    reviews: [
      { id: "r12", author: "Brianna H.", school: "Indiana University", date: "Apr 2025", rating: 1, text: "Discovered black mold in the bathroom two months in. Reported it immediately. They sent someone to paint over it rather than remediate. I have asthma. This was a health hazard and they didn't care.", helpful: 112 },
      { id: "r13", author: "Sam G.", school: "Indiana University", date: "Jan 2025", rating: 2, text: "Pest issues from day one. Saw cockroaches multiple times. Their response was to hand me a can of Raid. I was paying $1,100/month. Never again.", helpful: 89 },
      { id: "r14", author: "Alex N.", school: "Indiana University", date: "Nov 2024", rating: 2, text: "Took 3 months to fix a broken door lock. Three months! I felt genuinely unsafe. When I tried to break my lease for safety reasons they tried to charge me 4 months rent.", helpful: 73 },
    ],
  },
  {
    id: "6",
    name: "Boilermaker Realty",
    university: "Purdue University",
    address: "614 State St, West Lafayette, IN 47906",
    avgRating: 3.9,
    reviewCount: 41,
    tags: ["Good Value", "Central Location"],
    reviews: [
      { id: "r15", author: "Rachel O.", school: "Purdue University", date: "May 2025", rating: 4, text: "Fair and transparent. They have a clear move-in checklist process so there's no ambiguity about deposit deductions. Rent is competitive for how close it is to campus.", helpful: 26 },
      { id: "r16", author: "Darius K.", school: "Purdue University", date: "Feb 2025", rating: 4, text: "Two-year tenant here. They've been consistently good. One maintenance issue took longer than expected but they communicated throughout. Would recommend.", helpful: 18 },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function ratingColor(r: number): string {
  if (r >= 4) return "text-emerald-700";
  if (r >= 3) return "text-amber-600";
  return "text-red-700";
}

function ratingBg(r: number): string {
  if (r >= 4) return "bg-emerald-50 border-emerald-200";
  if (r >= 3) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function ratingLabel(r: number): string {
  if (r >= 4.5) return "Excellent";
  if (r >= 4) return "Good";
  if (r >= 3) return "Average";
  if (r >= 2) return "Poor";
  return "Avoid";
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}
        />
      ))}
    </span>
  );
}

function InteractiveStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            size={28}
            className={
              i <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted"
            }
          />
        </button>
      ))}
    </span>
  );
}

// ── Landlord Card ─────────────────────────────────────────────────────────────

function LandlordCard({ landlord, onClick }: { landlord: Landlord; onClick: () => void }) {
  const preview = landlord.reviews[0]?.text ?? "";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3
            className="font-['Lora'] font-semibold text-[1.05rem] text-foreground group-hover:text-primary transition-colors line-clamp-1"
          >
            {landlord.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <School size={11} />
            {landlord.university}
          </p>
        </div>
        <div className={`shrink-0 border rounded-lg px-3 py-1.5 text-center ${ratingBg(landlord.avgRating)}`}>
          <div className={`font-['Lora'] font-bold text-xl leading-none ${ratingColor(landlord.avgRating)}`}>
            {landlord.avgRating.toFixed(1)}
          </div>
          <div className={`text-[10px] font-medium mt-0.5 ${ratingColor(landlord.avgRating)}`}>
            {ratingLabel(landlord.avgRating)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        <StarRow rating={landlord.avgRating} size={13} />
        <span className="text-xs text-muted-foreground ml-1">({landlord.reviewCount} reviews)</span>
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-1 mb-3">
        <MapPin size={11} className="mt-0.5 shrink-0" />
        <span className="line-clamp-1">{landlord.address}</span>
      </p>

      {preview && (
        <p className="text-sm text-foreground/70 line-clamp-2 leading-relaxed border-t border-border pt-3 mt-3">
          "{preview}"
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {landlord.tags.map((t) => (
          <span key={t} className="text-[10px] bg-secondary text-muted-foreground rounded-full px-2 py-0.5 font-medium">
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ── Landlord Profile Modal ───────────────────────────────────────────────────

function ProfileModal({ landlord, onClose }: { landlord: Landlord; onClose: () => void }) {
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  const ratingDist = useMemo(() => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    landlord.reviews.forEach((r) => { dist[r.rating] = (dist[r.rating] ?? 0) + 1; });
    return dist;
  }, [landlord]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25 }}
        className="bg-card w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div>
            <h2 className="font-['Lora'] font-bold text-xl text-foreground">{landlord.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin size={12} />
              {landlord.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Rating summary */}
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <div className={`font-['Lora'] font-bold text-5xl ${ratingColor(landlord.avgRating)}`}>
                {landlord.avgRating.toFixed(1)}
              </div>
              <StarRow rating={landlord.avgRating} size={16} />
              <p className="text-xs text-muted-foreground mt-1">{landlord.reviewCount} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDist[star] ?? 0;
                const pct = landlord.reviewCount > 0 ? (count / landlord.reviewCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs w-4 text-right text-muted-foreground">{star}</span>
                    <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {landlord.tags.map((t) => (
              <span key={t} className="text-xs bg-secondary border border-border text-foreground rounded-full px-3 py-1 font-medium">
                {t}
              </span>
            ))}
          </div>

          {/* Reviews */}
          <div>
            <h3 className="font-['Lora'] font-semibold text-base mb-4">Student Reviews</h3>
            <div className="space-y-4">
              {landlord.reviews.map((review) => (
                <div key={review.id} className="border border-border rounded-xl p-4 bg-secondary/40">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="font-semibold text-sm">{review.author}</div>
                      <div className="text-xs text-muted-foreground">{review.school} · {review.date}</div>
                    </div>
                    <div className={`border rounded-lg px-2.5 py-1 ${ratingBg(review.rating)}`}>
                      <span className={`font-['Lora'] font-bold text-lg leading-none ${ratingColor(review.rating)}`}>
                        {review.rating}.0
                      </span>
                    </div>
                  </div>
                  <StarRow rating={review.rating} size={12} />
                  <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{review.text}</p>
                  <button
                    onClick={() => setHelpfulVotes((v) => ({ ...v, [review.id]: !v[review.id] }))}
                    className={`flex items-center gap-1.5 text-xs mt-3 rounded-full px-3 py-1 border transition-colors ${helpfulVotes[review.id] ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
                  >
                    <ThumbsUp size={11} />
                    Helpful · {review.helpful + (helpfulVotes[review.id] ? 1 : 0)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Write Review Modal ───────────────────────────────────────────────────────

interface ReviewFormData {
  landlordName: string;
  landlordId: string;
  school: string;
  address: string;
  rating: number;
  reviewText: string;
}

function WriteReviewModal({ onClose, prefillLandlord }: { onClose: () => void; prefillLandlord?: Landlord }) {
  const [form, setForm] = useState<ReviewFormData>({
    landlordName: prefillLandlord?.name ?? "",
    landlordId: prefillLandlord?.id ?? "",
    school: prefillLandlord?.university ?? "",
    address: prefillLandlord?.address ?? "",
    rating: 0,
    reviewText: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [addingNew, setAddingNew] = useState(!prefillLandlord);

  const valid = form.rating > 0 && form.reviewText.trim().length > 20 && form.landlordName.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25 }}
        className="bg-card w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-['Lora'] font-bold text-lg">Write a Review</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Star size={32} className="fill-emerald-500 text-emerald-500" />
            </div>
            <h3 className="font-['Lora'] font-bold text-xl">Review Submitted!</h3>
            <p className="text-muted-foreground text-sm">Thanks for helping fellow students make informed decisions. Your review will be visible after a quick verification check.</p>
            <button onClick={onClose} className="mt-2 bg-primary text-primary-foreground rounded-xl px-6 py-2.5 font-semibold text-sm hover:bg-primary/90 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Landlord selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">Landlord / Property Manager</label>
              {!addingNew ? (
                <div>
                  <select
                    value={form.landlordId}
                    onChange={(e) => {
                      const l = LANDLORDS.find((x) => x.id === e.target.value);
                      if (l) setForm((f) => ({ ...f, landlordId: l.id, landlordName: l.name, school: l.university, address: l.address }));
                    }}
                    className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a landlord…</option>
                    {LANDLORDS.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAddingNew(true)}
                    className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Landlord not listed? Add them
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Landlord or company name"
                    value={form.landlordName}
                    onChange={(e) => setForm((f) => ({ ...f, landlordName: e.target.value }))}
                    className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                  {!prefillLandlord && (
                    <button
                      type="button"
                      onClick={() => setAddingNew(false)}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Choose existing landlord instead
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* School */}
            <div>
              <label className="block text-sm font-semibold mb-2">Your School</label>
              <select
                value={form.school}
                onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select your school…</option>
                {SCHOOLS.slice(1).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold mb-2">Property Address</label>
              <input
                type="text"
                placeholder="123 Main St, City, State ZIP"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Overall Rating
                {form.rating > 0 && (
                  <span className={`ml-2 text-xs font-medium ${ratingColor(form.rating)}`}>
                    — {ratingLabel(form.rating)}
                  </span>
                )}
              </label>
              <InteractiveStars value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
            </div>

            {/* Review text */}
            <div>
              <label className="block text-sm font-semibold mb-2">Your Review</label>
              <textarea
                rows={5}
                placeholder="Tell other students what it was like to live there. Was the landlord responsive? Were repairs handled quickly? Any deposit issues?"
                value={form.reviewText}
                onChange={(e) => setForm((f) => ({ ...f, reviewText: e.target.value }))}
                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none leading-relaxed"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum 20 characters · {form.reviewText.length} typed</p>
            </div>

            <div className="bg-secondary/60 border border-border rounded-xl p-3 flex gap-2.5 text-xs text-muted-foreground">
              <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
              <span>Review posts anonymously. Verified .edu email accounts get a trust badge — coming soon.</span>
            </div>

            <button
              type="submit"
              disabled={!valid}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Review
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 4;

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("All Schools");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest" | "most_reviewed">("most_reviewed");
  const [ratingFilter, setRatingFilter] = useState<"all" | "good" | "avg" | "poor">("all");
  const [page, setPage] = useState(1);
  const [profileOpen, setProfileOpen] = useState<Landlord | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // close filter dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    let list = [...LANDLORDS];
    if (selectedSchool !== "All Schools") list = list.filter((l) => l.university === selectedSchool);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.university.toLowerCase().includes(q)
      );
    }
    if (ratingFilter === "good") list = list.filter((l) => l.avgRating >= 4);
    if (ratingFilter === "avg") list = list.filter((l) => l.avgRating >= 3 && l.avgRating < 4);
    if (ratingFilter === "poor") list = list.filter((l) => l.avgRating < 3);
    if (sortBy === "highest") list.sort((a, b) => b.avgRating - a.avgRating);
    if (sortBy === "lowest") list.sort((a, b) => a.avgRating - b.avgRating);
    if (sortBy === "most_reviewed") list.sort((a, b) => b.reviewCount - a.reviewCount);
    return list;
  }, [query, selectedSchool, sortBy, ratingFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch() {
    setPage(1);
  }

  const stats = useMemo(() => ({
    landlords: LANDLORDS.length,
    reviews: LANDLORDS.reduce((s, l) => s + l.reviewCount, 0),
    schools: new Set(LANDLORDS.map((l) => l.university)).size,
  }), []);

  return (
    <div className="min-h-screen bg-background font-['Inter']">
      {/* ── Sticky Navbar ── */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-['Lora'] font-bold text-lg text-foreground tracking-tight">
              Rate<span className="text-primary">My</span>Landlord
            </span>
          </a>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#search" className="hover:text-foreground transition-colors">Search</a>
            <a href="#" className="hover:text-foreground transition-colors">Browse Schools</a>
            <a href="#" className="hover:text-foreground transition-colors">How It Works</a>
          </nav>

          <button
            onClick={() => setReviewModalOpen(true)}
            className="shrink-0 flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Write a Review</span>
            <span className="sm:hidden">Review</span>
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#2C1810] to-[#1A1209] pt-16 pb-20 px-4">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs text-white/80 font-medium mb-6">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            Trusted by students at {stats.schools}+ universities
          </div>

          <h1 className="font-['Lora'] font-bold text-4xl sm:text-5xl text-white leading-tight mb-4">
            Find out before<br />
            <span className="text-[#FF8A80]">you sign.</span>
          </h1>
          <p className="text-white/60 text-lg mb-10">
            Real reviews from students who lived there — not ads, not filters.
          </p>

          {/* Search bar */}
          <div id="search" className="bg-card rounded-2xl p-3 shadow-2xl max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* School dropdown */}
              <div className="relative sm:w-52 shrink-0">
                <select
                  value={selectedSchool}
                  onChange={(e) => { setSelectedSchool(e.target.value); setPage(1); }}
                  className="w-full appearance-none bg-input-background border border-border rounded-xl pl-4 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground font-medium"
                >
                  {SCHOOLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>

              {/* Text search */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search landlord name or address…"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-input-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              <button
                onClick={handleSearch}
                className="bg-primary text-primary-foreground rounded-xl px-6 py-2.5 font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0 flex items-center gap-2"
              >
                Search
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stat Cards ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: Users, label: "Landlords Rated", value: stats.landlords.toString() },
            { icon: Star, label: "Total Reviews", value: stats.reviews.toLocaleString() },
            { icon: School, label: "Schools Covered", value: stats.schools.toString() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <Icon size={18} className="text-primary mx-auto mb-1.5" />
              <div className="font-['Lora'] font-bold text-2xl text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Results ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h2 className="font-['Lora'] font-bold text-xl text-foreground">
              {selectedSchool === "All Schools" ? "All Landlords" : selectedSchool}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
              {query && <span> for "<em>{query}</em>"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Rating filter pills */}
            {(["all", "good", "avg", "poor"] as const).map((f) => {
              const labels = { all: "All Ratings", good: "Good (4+)", avg: "Average (3–4)", poor: "Poor (<3)" };
              return (
                <button
                  key={f}
                  onClick={() => { setRatingFilter(f); setPage(1); }}
                  className={`text-xs rounded-full px-3 py-1.5 border font-medium transition-colors ${ratingFilter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                >
                  {labels[f]}
                </button>
              );
            })}

            {/* Sort dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-1.5 text-xs bg-card border border-border rounded-full px-3 py-1.5 font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                <Filter size={12} />
                Sort
                <ChevronDown size={11} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg py-1.5 w-44 z-20"
                  >
                    {(["most_reviewed", "highest", "lowest"] as const).map((s) => {
                      const labels = { most_reviewed: "Most Reviewed", highest: "Highest Rated", lowest: "Lowest Rated" };
                      return (
                        <button
                          key={s}
                          onClick={() => { setSortBy(s); setFilterOpen(false); setPage(1); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${sortBy === s ? "text-primary font-semibold" : "text-foreground"}`}
                        >
                          {labels[s]}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Grid */}
        {paginated.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paginated.map((l) => (
                <LandlordCard key={l.id} landlord={l} onClick={() => setProfileOpen(l)} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted text-foreground"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          // Empty state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 px-6"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-['Lora'] font-bold text-xl mb-2">No results found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              We don't have reviews for that landlord yet. Be the first student to share your experience and help others.
            </p>
            <button
              onClick={() => setReviewModalOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              Add the First Review
            </button>
          </motion.div>
        )}
      </section>

      {/* ── Future Features Banner ── */}
      <section className="bg-[#2C1810] mt-4 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-['Lora'] font-bold text-2xl text-white mb-3">Coming Soon</h2>
          <p className="text-white/50 text-sm mb-8">We're building the most trusted housing resource for students.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "🎓", label: "Verified .edu Accounts" },
              { icon: "🗺️", label: "Map View" },
              { icon: "🤖", label: "AI Review Summaries" },
              { icon: "📸", label: "Photo Uploads" },
              { icon: "💬", label: "Landlord Responses" },
              { icon: "🔖", label: "Saved Landlords" },
              { icon: "👍", label: "Helpful Votes" },
              { icon: "🛡️", label: "Spam Detection" },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                <div className="text-xl mb-1.5">{icon}</div>
                <div className="text-white/70 text-xs font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1A1209] py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen size={13} className="text-white" />
            </div>
            <span className="font-['Lora'] font-bold text-base text-white">
              Rate<span className="text-[#FF8A80]">My</span>Landlord
            </span>
          </div>
          <p className="text-white/30 text-xs text-center">
            Helping students make informed housing decisions since 2024.
            Reviews are from verified student tenants.
          </p>
          <div className="flex gap-4 text-xs text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/70 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* ── Modals ── */}
      <AnimatePresence>
        {profileOpen && (
          <ProfileModal landlord={profileOpen} onClose={() => setProfileOpen(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {reviewModalOpen && (
          <WriteReviewModal onClose={() => setReviewModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
