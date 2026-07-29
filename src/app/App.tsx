import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Star, MapPin, ChevronDown, X, BookOpen, Users, School, ArrowRight, Filter, Plus, ThumbsUp, ChevronLeft, ChevronRight, AlertCircle, Heart, CircleHelp, Pencil } from "lucide-react";
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

interface RentalProperty {
  id: string;
  title: string;
  beds: number;
  baths: number;
  rent: number;
  groundRules: string[];
}

interface Landlord {
  id: string;
  name: string;
  university: string;
  address: string;
  photoUrl: string;
  bio: string;
  contactEmail: string;
  contactPhone: string;
  reviewedProperties: number;
  propertyLocations: string[];
  properties: RentalProperty[];
  primaryJob: boolean;
  avgRating: number;
  reviewCount: number;
  reviews: Review[];
  tags: string[];
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const SCHOOLS = [
  "All Schools",
  "Cornell University",
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
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80",
    bio: "Greenfield focuses on student-safe, well-maintained housing near central campus and has operated in Ann Arbor for over 12 years.",
    contactEmail: "leasing@greenfieldpm.com",
    contactPhone: "(734) 555-0142",
    reviewedProperties: 21,
    propertyLocations: ["Downtown Ann Arbor", "South University", "Kerrytown"],
    properties: [
      { id: "p1", title: "State Street Lofts", beds: 3, baths: 2, rent: 3150, groundRules: ["No smoking", "Quiet hours after 10pm", "Co-signer required"] },
      { id: "p2", title: "Kerrytown Flats", beds: 2, baths: 1, rent: 2350, groundRules: ["No subletting without approval", "Pet fee required"] },
    ],
    primaryJob: true,
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
    photoUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=500&q=80",
    bio: "Campus Corner manages dense off-campus inventory close to OSU and primarily serves undergrad tenants with short leasing cycles.",
    contactEmail: "support@campuscornerrentals.com",
    contactPhone: "(614) 555-0173",
    reviewedProperties: 34,
    propertyLocations: ["Short North", "University District", "Clintonville"],
    properties: [
      { id: "p3", title: "High Street Duplex", beds: 4, baths: 2, rent: 2800, groundRules: ["Monthly inspection notice", "No parties in common areas", "Trash schedule enforced"] },
    ],
    primaryJob: true,
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
    photoUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=500&q=80",
    bio: "Nittany Properties is a small local operator balancing student and family units, with an emphasis on mid-range pricing.",
    contactEmail: "hello@nittanyproperties.com",
    contactPhone: "(814) 555-0191",
    reviewedProperties: 13,
    propertyLocations: ["College Ave", "Beaver Canyon", "North Atherton"],
    properties: [
      { id: "p4", title: "College Ave Classic", beds: 2, baths: 1, rent: 1950, groundRules: ["No smoking", "Tenant handles utilities", "12-month lease minimum"] },
    ],
    primaryJob: false,
    avgRating: 3.6,
    reviewCount: 38,
    tags: ["Decent Location", "Mom-and-Pop"],
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
    photoUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=80",
    bio: "Lakeside runs premium student units near campus with an operations team known for proactive communication and upgrades.",
    contactEmail: "team@lakesidestudenthousing.com",
    contactPhone: "(608) 555-0126",
    reviewedProperties: 18,
    propertyLocations: ["Langdon", "State Street", "Capitol East"],
    properties: [
      { id: "p5", title: "Langdon Premium Suites", beds: 3, baths: 3, rent: 3900, groundRules: ["No overnight guests over 3 nights", "Building gym closes at 11pm", "Pet addendum required"] },
    ],
    primaryJob: true,
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
    photoUrl: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=500&q=80",
    bio: "Hoosier Homes manages high-turnover student stock and also oversees commercial spaces in Bloomington.",
    contactEmail: "office@hoosierhomesmgmt.com",
    contactPhone: "(812) 555-0188",
    reviewedProperties: 27,
    propertyLocations: ["Downtown Bloomington", "Kirkwood", "East 3rd Corridor"],
    properties: [
      { id: "p6", title: "Kirkwood Shared House", beds: 5, baths: 2, rent: 3200, groundRules: ["No candles", "Mandatory renter insurance", "No wall-mounted TVs without permission"] },
    ],
    primaryJob: false,
    avgRating: 1.8,
    reviewCount: 74,
    tags: ["Mold Issues", "Unresponsive", "Mom-and-Pop"],
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
    photoUrl: "https://images.unsplash.com/photo-1562788869-4ed32648eb72?auto=format&fit=crop&w=500&q=80",
    bio: "Boilermaker Realty specializes in practical student leases around Purdue, with a focus on transparent terms and routine maintenance.",
    contactEmail: "info@boilermakerrealty.com",
    contactPhone: "(765) 555-0114",
    reviewedProperties: 16,
    propertyLocations: ["State Street", "Chauncey", "Levee District"],
    properties: [
      { id: "p7", title: "Chauncey Terrace", beds: 2, baths: 2, rent: 2200, groundRules: ["No smoking", "Parking pass required", "Noise curfew after 11pm"] },
      { id: "p8", title: "Levee Studios", beds: 1, baths: 1, rent: 1450, groundRules: ["No pets", "Key replacement fee applies"] },
    ],
    primaryJob: true,
    avgRating: 3.9,
    reviewCount: 41,
    tags: ["Good Value", "Central Location"],
    reviews: [
      { id: "r15", author: "Rachel O.", school: "Purdue University", date: "May 2025", rating: 4, text: "Fair and transparent. They have a clear move-in checklist process so there's no ambiguity about deposit deductions. Rent is competitive for how close it is to campus.", helpful: 26 },
      { id: "r16", author: "Darius K.", school: "Purdue University", date: "Feb 2025", rating: 4, text: "Two-year tenant here. They've been consistently good. One maintenance issue took longer than expected but they communicated throughout. Would recommend.", helpful: 18 },
    ],
  },
  {
    id: "7",
    name: "Cascadilla Family Rentals",
    university: "Cornell University",
    address: "109 Eddy St, Ithaca, NY 14850",
    photoUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=500&q=80",
    bio: "A family-run landlord near Cornell focused on smaller buildings and direct communication with student tenants.",
    contactEmail: "hello@cascadillafamilyrentals.com",
    contactPhone: "(607) 555-0138",
    reviewedProperties: 9,
    propertyLocations: ["Collegetown", "Eddy Street", "Cascadilla Gorge"],
    properties: [
      { id: "p9", title: "Eddy Street Brownstone", beds: 3, baths: 2, rent: 3450, groundRules: ["No smoking", "No sublets without written approval", "Quiet hours after 11pm"] },
      { id: "p10", title: "Cascadilla Terrace", beds: 2, baths: 1, rent: 2550, groundRules: ["Tenant handles electric", "Pet approval required"] },
    ],
    primaryJob: false,
    avgRating: 4.4,
    reviewCount: 22,
    tags: ["Mom-and-Pop", "Responsive", "Fair Policies"],
    reviews: [
      { id: "r17", author: "Lena C.", school: "Cornell University", date: "Apr 2025", rating: 5, text: "Very easy to work with and actually reachable by phone. They fixed a leaking sink the same day and were upfront about every fee in the lease.", helpful: 17 },
      { id: "r18", author: "Rahul S.", school: "Cornell University", date: "Dec 2024", rating: 4, text: "Good overall experience in Collegetown. Building is older, but they maintain it well and gave us clear move-out expectations.", helpful: 11 },
    ],
  },
  {
    id: "8",
    name: "Twin Oaks Student Rentals",
    university: "Michigan State",
    address: "415 Albert Ave, East Lansing, MI 48823",
    photoUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=500&q=80",
    bio: "Twin Oaks is a small owner-operated portfolio with duplexes and walk-up units near campus.",
    contactEmail: "leasing@twinoaksrentals.com",
    contactPhone: "(517) 555-0109",
    reviewedProperties: 11,
    propertyLocations: ["Grand River", "Albert Ave", "Oakland"],
    properties: [
      { id: "p11", title: "Albert Avenue Duplex", beds: 4, baths: 2, rent: 3000, groundRules: ["No indoor smoking", "Snow removal rota", "Parking permit required"] },
    ],
    primaryJob: false,
    avgRating: 3.5,
    reviewCount: 19,
    tags: ["Mom-and-Pop", "Value", "Older Units"],
    reviews: [
      { id: "r19", author: "Maya T.", school: "Michigan State", date: "Mar 2025", rating: 4, text: "Not luxury, but decent value and close to campus. Owner is direct and usually responds within a day.", helpful: 9 },
      { id: "r20", author: "Noah P.", school: "Michigan State", date: "Oct 2024", rating: 3, text: "Reasonable rent for East Lansing. Maintenance timing is mixed, but communication is better than most landlords I toured.", helpful: 7 },
    ],
  },
  {
    id: "9",
    name: "Maple & Main Rentals",
    university: "University of Minnesota",
    address: "742 15th Ave SE, Minneapolis, MN 55414",
    photoUrl: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=500&q=80",
    bio: "Small family-operated rentals around Dinkytown with straightforward lease communication.",
    contactEmail: "info@maplemainrentals.com",
    contactPhone: "(612) 555-0121",
    reviewedProperties: 8,
    propertyLocations: ["Dinkytown", "Como", "Marcy-Holmes"],
    properties: [
      { id: "p12", title: "15th Avenue Triplex", beds: 3, baths: 2, rent: 2950, groundRules: ["No smoking", "Shared yard quiet hours after 10pm", "Tenant snow shoveling rota"] },
    ],
    primaryJob: false,
    avgRating: 4.1,
    reviewCount: 17,
    tags: ["Mom-and-Pop", "Responsive", "Clear Lease"],
    reviews: [
      { id: "r21", author: "Ivy L.", school: "University of Minnesota", date: "May 2025", rating: 4, text: "Owner replies quickly and explains lease items in plain language. Place is older but well maintained.", helpful: 8 },
      { id: "r22", author: "Grant P.", school: "University of Minnesota", date: "Nov 2024", rating: 4, text: "Good value near campus and fewer surprise fees than other places we toured.", helpful: 6 },
    ],
  },
  {
    id: "10",
    name: "Badger Block Housing",
    university: "University of Wisconsin",
    address: "211 N Frances St, Madison, WI 53703",
    photoUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=500&q=80",
    bio: "A larger student-focused management company with buildings concentrated near State Street.",
    contactEmail: "leasing@badgerblockhousing.com",
    contactPhone: "(608) 555-0160",
    reviewedProperties: 24,
    propertyLocations: ["State Street", "Mifflin", "Langdon"],
    properties: [
      { id: "p13", title: "Frances Street Residences", beds: 2, baths: 2, rent: 2700, groundRules: ["No smoking", "Move-in checklist required", "Pet fee and screening"] },
    ],
    primaryJob: true,
    avgRating: 3.2,
    reviewCount: 35,
    tags: ["Organized", "Mixed Maintenance", "Large Portfolio"],
    reviews: [
      { id: "r23", author: "Hannah Q.", school: "University of Wisconsin", date: "Feb 2025", rating: 3, text: "Leasing office is efficient but repair turnaround varies a lot by building.", helpful: 10 },
      { id: "r24", author: "Peter J.", school: "University of Wisconsin", date: "Sep 2024", rating: 3, text: "Decent location and fair process, but communication can feel automated.", helpful: 7 },
    ],
  },
  {
    id: "11",
    name: "Cayuga Porch Properties",
    university: "Cornell University",
    address: "223 Dryden Rd, Ithaca, NY 14850",
    photoUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=500&q=80",
    bio: "Owner-run Cornell rentals with renovated interiors and careful tenant screening.",
    contactEmail: "team@cayugaporch.com",
    contactPhone: "(607) 555-0117",
    reviewedProperties: 7,
    propertyLocations: ["Collegetown", "Dryden Road"],
    properties: [
      { id: "p14", title: "Dryden Corner Apartments", beds: 2, baths: 1, rent: 2680, groundRules: ["No smoking", "No party hosting", "Co-signer required for undergrads"] },
    ],
    primaryJob: false,
    avgRating: 4.6,
    reviewCount: 14,
    tags: ["Mom-and-Pop", "Clean", "Quiet Building"],
    reviews: [
      { id: "r25", author: "Sonia R.", school: "Cornell University", date: "Mar 2025", rating: 5, text: "Very responsive and the apartment was spotless at move-in. No hidden fees.", helpful: 12 },
      { id: "r26", author: "Ben Y.", school: "Cornell University", date: "Oct 2024", rating: 4, text: "Slightly strict rules, but management is fair and transparent.", helpful: 6 },
    ],
  },
  {
    id: "12",
    name: "Spartan City Living",
    university: "Michigan State",
    address: "920 E Grand River Ave, East Lansing, MI 48823",
    photoUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=500&q=80",
    bio: "Regional property operator serving high-volume student leases around MSU.",
    contactEmail: "hello@spartancityliving.com",
    contactPhone: "(517) 555-0147",
    reviewedProperties: 31,
    propertyLocations: ["Grand River", "Bogue", "Harrison"],
    properties: [
      { id: "p15", title: "Grand River Towers", beds: 1, baths: 1, rent: 1620, groundRules: ["No smoking", "Move-out cleaning checklist", "Parking waitlist"] },
    ],
    primaryJob: true,
    avgRating: 2.9,
    reviewCount: 53,
    tags: ["Busy Leasing Office", "Inconsistent Repairs"],
    reviews: [
      { id: "r27", author: "Miles A.", school: "Michigan State", date: "Jan 2025", rating: 3, text: "Good location, but maintenance can take too long when there are many requests.", helpful: 15 },
      { id: "r28", author: "Erin D.", school: "Michigan State", date: "Aug 2024", rating: 2, text: "Process-heavy and not very flexible, though staff were polite.", helpful: 11 },
    ],
  },
  {
    id: "13",
    name: "Buckeye Bungalow Rentals",
    university: "Ohio State University",
    address: "1484 Neil Ave, Columbus, OH 43201",
    photoUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=500&q=80",
    bio: "A local owner team focused on duplexes and small houses near OSU.",
    contactEmail: "contact@buckeyebungalow.com",
    contactPhone: "(614) 555-0104",
    reviewedProperties: 10,
    propertyLocations: ["University District", "Northwood", "Old North"],
    properties: [
      { id: "p16", title: "Neil Avenue Bungalow", beds: 4, baths: 2, rent: 2860, groundRules: ["No smoking", "Yard care split by tenants", "Guest parking permit"] },
    ],
    primaryJob: false,
    avgRating: 4.0,
    reviewCount: 16,
    tags: ["Mom-and-Pop", "Fair Pricing", "Direct Communication"],
    reviews: [
      { id: "r29", author: "Julia M.", school: "Ohio State University", date: "Apr 2025", rating: 4, text: "Easy to reach and fair about security deposit deductions.", helpful: 9 },
      { id: "r30", author: "Chris V.", school: "Ohio State University", date: "Sep 2024", rating: 4, text: "Older house, but they handled maintenance requests responsibly.", helpful: 6 },
    ],
  },
  {
    id: "14",
    name: "Gopher Gate Properties",
    university: "University of Minnesota",
    address: "601 SE 8th St, Minneapolis, MN 55414",
    photoUrl: "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=500&q=80",
    bio: "Student-focused management firm with modernized units and digital leasing tools.",
    contactEmail: "support@gophergateproperties.com",
    contactPhone: "(612) 555-0182",
    reviewedProperties: 20,
    propertyLocations: ["Marcy-Holmes", "Prospect Park"],
    properties: [
      { id: "p17", title: "8th Street Flats", beds: 2, baths: 2, rent: 2460, groundRules: ["No smoking", "Package locker policy", "Pet addendum required"] },
    ],
    primaryJob: true,
    avgRating: 3.7,
    reviewCount: 28,
    tags: ["Modern Units", "Service Varies"],
    reviews: [
      { id: "r31", author: "Kara N.", school: "University of Minnesota", date: "Feb 2025", rating: 4, text: "Nice unit and easy online payments. Maintenance was okay, not amazing.", helpful: 8 },
      { id: "r32", author: "Eli S.", school: "University of Minnesota", date: "Jul 2024", rating: 3, text: "Good amenities, but communication lagged during move-out week.", helpful: 5 },
    ],
  },
  {
    id: "15",
    name: "Boiler Family Leasing",
    university: "Purdue University",
    address: "230 Waldron St, West Lafayette, IN 47906",
    photoUrl: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=500&q=80",
    bio: "A husband-and-wife team renting a handful of student homes near Purdue.",
    contactEmail: "leasing@boilerfamilyleasing.com",
    contactPhone: "(765) 555-0133",
    reviewedProperties: 6,
    propertyLocations: ["Chauncey", "Waldron"],
    properties: [
      { id: "p18", title: "Waldron Corner House", beds: 3, baths: 2, rent: 2480, groundRules: ["No smoking", "Quiet porch after 10pm", "Tenant responsible for lawn care"] },
    ],
    primaryJob: false,
    avgRating: 4.3,
    reviewCount: 12,
    tags: ["Mom-and-Pop", "Helpful", "Well Maintained"],
    reviews: [
      { id: "r33", author: "Nina B.", school: "Purdue University", date: "May 2025", rating: 5, text: "Very kind landlords and super clear move-in process. Great experience.", helpful: 10 },
      { id: "r34", author: "Owen T.", school: "Purdue University", date: "Nov 2024", rating: 4, text: "Not fancy, but clean and fairly priced. They respond quickly.", helpful: 7 },
    ],
  },
  {
    id: "16",
    name: "Lionheart Student Residences",
    university: "Penn State",
    address: "417 W Beaver Ave, State College, PA 16801",
    photoUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=500&q=80",
    bio: "A multi-property student housing operator with renovated units close to central campus.",
    contactEmail: "team@lionheartresidences.com",
    contactPhone: "(814) 555-0159",
    reviewedProperties: 22,
    propertyLocations: ["Beaver Ave", "Downtown State College"],
    properties: [
      { id: "p19", title: "Beaver Avenue Residences", beds: 2, baths: 2, rent: 2580, groundRules: ["No smoking", "Maintenance portal submissions", "Move-out inspection required"] },
    ],
    primaryJob: true,
    avgRating: 3.8,
    reviewCount: 33,
    tags: ["Renovated", "Predictable Process"],
    reviews: [
      { id: "r35", author: "Maddie F.", school: "Penn State", date: "Apr 2025", rating: 4, text: "Nice renovations and decent communication throughout the lease.", helpful: 9 },
      { id: "r36", author: "Logan C.", school: "Penn State", date: "Sep 2024", rating: 3, text: "Solid option overall, but some fees felt higher than expected.", helpful: 6 },
    ],
  },
];

const ONGOING_COMPLAINTS: Record<string, string[]> = {
  "1": [],
  "2": ["Heating repair delays in winter", "Deposit deduction disputes still under follow-up"],
  "3": ["Slow response during peak move-in periods"],
  "4": [],
  "5": ["Unresolved mold remediation concerns", "Repeated pest complaints in older units"],
  "6": [],
  "7": [],
  "8": ["Intermittent maintenance delays"],
  "9": [],
  "10": ["Repair ticket backlog in one building"],
  "11": [],
  "12": ["Long wait times on non-emergency maintenance"],
  "13": [],
  "14": ["Move-out fee disputes reported by some tenants"],
  "15": [],
  "16": ["Higher-than-expected admin fees reported"],
};

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

function normalizeSearch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matchesSearch(haystack: string, rawQuery: string): boolean {
  const normalizedHaystack = normalizeSearch(haystack);
  const tokens = normalizeSearch(rawQuery).split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((token) => normalizedHaystack.includes(token));
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

function LandlordCard({
  landlord,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  landlord: Landlord;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
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
        <div className="flex items-start gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-1.5 rounded-lg border transition-colors ${isFavorite ? "border-rose-300 bg-rose-50 text-rose-500" : "border-border text-muted-foreground hover:text-rose-500 hover:border-rose-300"}`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            title={isFavorite ? "Remove favorite" : "Favorite"}
          >
            <Heart size={14} className={isFavorite ? "fill-rose-500" : ""} />
          </button>
          <div className={`border rounded-lg px-3 py-1.5 text-center ${ratingBg(landlord.avgRating)}`}>
            <div className={`font-['Lora'] font-bold text-xl leading-none ${ratingColor(landlord.avgRating)}`}>
              {landlord.avgRating.toFixed(1)}
            </div>
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

    </motion.div>
  );
}

// ── Landlord Profile Modal ───────────────────────────────────────────────────

function ProfileModal({
  landlord,
  onClose,
  isFavorite,
  onToggleFavorite,
  onEditReview,
}: {
  landlord: Landlord;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onEditReview: (review: Review) => void;
}) {
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});
  const [bioOpen, setBioOpen] = useState(true);

  const allGroundRules = useMemo(
    () => Array.from(new Set(landlord.properties.flatMap((property) => property.groundRules))),
    [landlord],
  );

  const ongoingComplaints = useMemo(() => ONGOING_COMPLAINTS[landlord.id] ?? [], [landlord.id]);

  const ratingDist = useMemo(() => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    landlord.reviews.forEach((r) => { dist[r.rating] = (dist[r.rating] ?? 0) + 1; });
    return dist;
  }, [landlord]);

  const mostCommonComments = useMemo(() => {
    const themes = [
      { label: "Maintenance responsiveness", keywords: ["maintenance", "repair", "fixed", "respond"] },
      { label: "Deposit fairness", keywords: ["deposit", "deduction", "refund"] },
      { label: "Cleanliness", keywords: ["clean", "spotless", "mold", "pest", "cockroach"] },
      { label: "Communication", keywords: ["communicat", "reach", "response", "notice"] },
      { label: "Lease transparency", keywords: ["lease", "hidden", "fee", "clause", "transparent"] },
      { label: "Location convenience", keywords: ["location", "campus", "walk", "central"] },
    ];

    const counts = themes
      .map((theme) => {
        const count = landlord.reviews.reduce((sum, review) => {
          const reviewText = review.text.toLowerCase();
          return theme.keywords.some((keyword) => reviewText.includes(keyword)) ? sum + 1 : sum;
        }, 0);
        return { label: theme.label, count };
      })
      .filter((theme) => theme.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return counts;
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-lg border transition-colors ${isFavorite ? "border-rose-300 bg-rose-50 text-rose-500" : "border-border text-muted-foreground hover:text-rose-500 hover:border-rose-300"}`}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              title={isFavorite ? "Remove favorite" : "Favorite"}
            >
              <Heart size={16} className={isFavorite ? "fill-rose-500" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile summary */}
          <section className="border border-border rounded-xl overflow-hidden bg-secondary/30">
            <button
              type="button"
              onClick={() => setBioOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/60 transition-colors"
            >
              <span className="font-['Lora'] font-semibold text-base text-foreground">Landlord Profile</span>
              <ChevronDown size={16} className={`transition-transform ${bioOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {bioOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-4"
                >
                  <div className="flex items-start gap-4 pt-2">
                    <img
                      src={landlord.photoUrl}
                      alt={`${landlord.name} profile`}
                      className="w-16 h-16 rounded-xl object-cover border border-border"
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-sm text-foreground/80 leading-relaxed">{landlord.bio}</p>
                      <p className="text-xs text-muted-foreground">Contact: {landlord.contactEmail} · {landlord.contactPhone}</p>
                      <p className="text-xs text-muted-foreground">Reviewed properties: {landlord.reviewedProperties}</p>
                      <p className="text-xs text-muted-foreground">Property locations: {landlord.propertyLocations.join(", ")}</p>
                      <p className="text-xs text-muted-foreground">Primary job: {landlord.primaryJob ? "Yes" : "No"}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Landlord information */}
          <section className="border border-border rounded-xl p-4 bg-secondary/30 space-y-3">
            <h3 className="font-['Lora'] font-semibold text-base text-foreground">Landlord Information</h3>
            <p className="text-xs text-muted-foreground">Properties owned: {landlord.properties.length}</p>
            <p className="text-xs text-muted-foreground">Primary job: {landlord.primaryJob ? "Yes" : "No"}</p>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ground Rules Across Properties</p>
              {allGroundRules.length > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {allGroundRules.map((rule) => (
                    <li key={rule} className="text-xs text-foreground/80">• {rule}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground mt-1.5">No ground rules listed.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ongoing Complaints</p>
              {ongoingComplaints.length > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {ongoingComplaints.map((complaint) => (
                    <li key={complaint} className="text-xs text-foreground/80">• {complaint}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-700 mt-1.5">No ongoing complaints reported.</p>
              )}
            </div>
          </section>

          {/* Property information */}
          <div>
            <h3 className="font-['Lora'] font-semibold text-base mb-3">Property Information</h3>
            <div className="space-y-3">
              {landlord.properties.map((property) => (
                <div key={property.id} className="border border-border rounded-xl p-4 bg-secondary/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{property.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{property.beds} bed · {property.baths} bath · ${property.rent.toLocaleString()}/mo</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ground Rules</p>
                    <ul className="mt-1.5 space-y-1">
                      {property.groundRules.map((rule) => (
                        <li key={rule} className="text-xs text-foreground/80">• {rule}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Landlord rating */}
          <div>
            <h3 className="font-['Lora'] font-semibold text-base mb-3">Landlord Rating</h3>
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
          </div>

          {/* Most common comments */}
          <div>
            <h3 className="font-['Lora'] font-semibold text-base mb-3">Most Common Comments</h3>
            {mostCommonComments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {mostCommonComments.map((theme) => (
                  <div key={theme.label} className="border border-border rounded-lg px-3 py-2 bg-secondary/20 flex items-center justify-between gap-2">
                    <span className="text-sm text-foreground/85">{theme.label}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{theme.count} review{theme.count === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough review text yet to identify common themes.</p>
            )}
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
                  <div className="flex items-center justify-between gap-3 mt-3">
                    <button
                      onClick={() => setHelpfulVotes((v) => ({ ...v, [review.id]: !v[review.id] }))}
                      className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1 border transition-colors ${helpfulVotes[review.id] ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
                    >
                      <ThumbsUp size={11} />
                      Helpful · {review.helpful + (helpfulVotes[review.id] ? 1 : 0)}
                    </button>
                    {review.author === "You" && (
                      <button
                        type="button"
                        onClick={() => onEditReview(review)}
                        className="text-xs rounded-full px-3 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Pencil size={11} />
                        Edit your review
                      </button>
                    )}
                  </div>
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

interface EditableReviewContext {
  landlordId: string;
  review: Review;
}

interface SurveyState {
  rentBudget: "any" | "under_1000" | "1000_1500" | "1500_plus";
  apartmentPriority: "any" | "quiet" | "modern" | "walkable";
  landlordPriority: "any" | "responsive" | "fair" | "low_cost";
}

function WriteReviewModal({
  onClose,
  landlords,
  prefillLandlord,
  editingReview,
  onSubmitReview,
}: {
  onClose: () => void;
  landlords: Landlord[];
  prefillLandlord?: Landlord;
  editingReview?: EditableReviewContext | null;
  onSubmitReview: (data: ReviewFormData, editingReviewId?: string) => void;
}) {
  const isEditing = Boolean(editingReview);
  const [form, setForm] = useState<ReviewFormData>({
    landlordName: prefillLandlord?.name ?? "",
    landlordId: prefillLandlord?.id ?? editingReview?.landlordId ?? "",
    school: prefillLandlord?.university ?? editingReview?.review.school ?? "",
    address: prefillLandlord?.address ?? "",
    rating: editingReview?.review.rating ?? 0,
    reviewText: editingReview?.review.text ?? "",
  });
  const [addingNew, setAddingNew] = useState(!prefillLandlord && !editingReview);

  const valid = form.rating > 0 && form.reviewText.trim().length > 20 && form.landlordName.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmitReview(form, editingReview?.review.id);
    onClose();
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
          <h2 className="font-['Lora'] font-bold text-lg">{isEditing ? "Edit Your Review" : "Write a Review"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Landlord selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">Landlord / Property Manager</label>
              {!addingNew ? (
                <div>
                  <select
                    value={form.landlordId}
                    onChange={(e) => {
                      const l = landlords.find((x) => x.id === e.target.value);
                      if (l) setForm((f) => ({ ...f, landlordId: l.id, landlordName: l.name, school: l.university, address: l.address }));
                    }}
                    className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={isEditing}
                  >
                    <option value="">Select a landlord…</option>
                    {landlords.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setAddingNew(true)}
                      className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Landlord not listed? Add them
                    </button>
                  )}
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
              {isEditing ? "Save Changes" : "Submit Review"}
            </button>
          </form>
      </motion.div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 4;

export default function App() {
  const [activeView, setActiveView] = useState<"home" | "discover">("home");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("All Schools");
  const [areaQuery, setAreaQuery] = useState("Ann Arbor");
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [landlords, setLandlords] = useState<Landlord[]>(LANDLORDS);
  const [sortBy, setSortBy] = useState<"highest" | "lowest" | "most_reviewed">("highest");
  const [ratingFilter, setRatingFilter] = useState<"all" | "good" | "avg" | "poor">("all");
  const [page, setPage] = useState(1);
  const [profileOpenId, setProfileOpenId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewPrefillLandlordId, setReviewPrefillLandlordId] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<EditableReviewContext | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [surveyApplied, setSurveyApplied] = useState(false);
  const [survey, setSurvey] = useState<SurveyState>({
    rentBudget: "any",
    apartmentPriority: "any",
    landlordPriority: "any",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

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

  const profileOpen = useMemo(() => {
    if (!profileOpenId) return null;
    return landlords.find((l) => l.id === profileOpenId) ?? null;
  }, [profileOpenId, landlords]);

  const preferenceScore = (landlord: Landlord) => {
    if (!surveyApplied) return 0;
    let score = 0;
    const tags = landlord.tags.map((t) => t.toLowerCase());
    const reviewBlob = landlord.reviews.map((r) => r.text.toLowerCase()).join(" ");

    if (survey.landlordPriority === "responsive" && tags.some((t) => t.includes("responsive"))) score += 3;
    if (survey.landlordPriority === "fair" && tags.some((t) => t.includes("fair") || t.includes("value"))) score += 3;
    if (survey.landlordPriority === "low_cost" && tags.some((t) => t.includes("value") || t.includes("pricing"))) score += 3;

    if (survey.apartmentPriority === "modern" && tags.some((t) => t.includes("modern"))) score += 2;
    if (survey.apartmentPriority === "walkable" && tags.some((t) => t.includes("central") || t.includes("location"))) score += 2;
    if (survey.apartmentPriority === "quiet" && reviewBlob.includes("quiet")) score += 2;

    if (survey.rentBudget === "under_1000" && tags.some((t) => t.includes("value") || t.includes("pricing"))) score += 1;
    if (survey.rentBudget === "1000_1500" && landlord.avgRating >= 3) score += 1;
    if (survey.rentBudget === "1500_plus" && landlord.avgRating >= 4) score += 1;

    return score;
  };

  const filtered = useMemo(() => {
    let list = [...landlords];
    if (selectedSchool !== "All Schools") list = list.filter((l) => l.university === selectedSchool);
    if (searchTerm.trim()) {
      list = list.filter((l) => matchesSearch(`${l.name} ${l.address} ${l.university}`, searchTerm));
    }
    if (ratingFilter === "good") list = list.filter((l) => l.avgRating >= 4);
    if (ratingFilter === "avg") list = list.filter((l) => l.avgRating >= 3 && l.avgRating < 4);
    if (ratingFilter === "poor") list = list.filter((l) => l.avgRating < 3);

    if (surveyApplied) {
      list.sort((a, b) => preferenceScore(b) - preferenceScore(a));
    }

    if (sortBy === "highest") list.sort((a, b) => b.avgRating - a.avgRating);
    if (sortBy === "lowest") list.sort((a, b) => a.avgRating - b.avgRating);
    if (sortBy === "most_reviewed") list.sort((a, b) => b.reviewCount - a.reviewCount);
    return list;
  }, [landlords, searchTerm, selectedSchool, sortBy, ratingFilter, surveyApplied, survey]);

  const recommendedLandlords = useMemo(() => {
    return [...landlords]
      .sort((a, b) => {
        const preferenceDelta = preferenceScore(b) - preferenceScore(a);
        if (preferenceDelta !== 0) return preferenceDelta;
        return b.avgRating - a.avgRating;
      })
      .slice(0, 8);
  }, [landlords, surveyApplied, survey]);

  const discoverLandlords = useMemo(() => {
    const area = areaQuery.trim().toLowerCase();
    const q = discoverQuery.trim();
    let list = [...landlords];

    if (area) {
      list = list.filter((l) => `${l.address} ${l.university}`.toLowerCase().includes(area));
    }

    if (q) {
      list = list.filter((l) => matchesSearch(`${l.name} ${l.address} ${l.university}`, q));
    }

    return list.sort((a, b) => b.avgRating - a.avgRating);
  }, [landlords, areaQuery, discoverQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch() {
    setSearchTerm(searchInput);
    setPage(1);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleFavorite(landlordId: string) {
    setFavoriteIds((prev) => (prev.includes(landlordId) ? prev.filter((id) => id !== landlordId) : [...prev, landlordId]));
  }

  function handleOpenNewReview(prefillLandlordId?: string) {
    setEditingReview(null);
    setReviewPrefillLandlordId(prefillLandlordId ?? null);
    setReviewModalOpen(true);
  }

  function handleSubmitReview(form: ReviewFormData, editingReviewId?: string) {
    let resolvedLandlordId = form.landlordId;

    setLandlords((prev) => {
      let working = [...prev];

      if (!resolvedLandlordId) {
        resolvedLandlordId = `l-${Date.now()}`;
        const safeName = form.landlordName.trim() || "New Landlord";
        working = [
          {
            id: resolvedLandlordId,
            name: safeName,
            university: form.school,
            address: form.address,
            photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=EDE7DC&color=2C1810&size=256`,
            bio: "New landlord profile created from student review submissions.",
            contactEmail: "not-provided@example.com",
            contactPhone: "Not provided",
            reviewedProperties: 1,
            propertyLocations: [form.address || "Location not provided"],
            properties: [
              {
                id: `p-${Date.now()}`,
                title: "Submitted Property",
                beds: 1,
                baths: 1,
                rent: 1200,
                groundRules: ["Ground rules not provided yet"],
              },
            ],
            primaryJob: true,
            avgRating: form.rating,
            reviewCount: 0,
            reviews: [],
            tags: ["New Listing"],
          },
          ...working,
        ];
      }

      return working.map((landlord) => {
        if (landlord.id !== resolvedLandlordId) return landlord;

        if (editingReviewId) {
          const existing = landlord.reviews.find((r) => r.id === editingReviewId);
          if (!existing) return landlord;
          const updatedReviews = landlord.reviews.map((r) =>
            r.id === editingReviewId
              ? { ...r, rating: form.rating, text: form.reviewText.trim(), school: form.school }
              : r,
          );
          const total = landlord.avgRating * landlord.reviewCount - existing.rating + form.rating;
          const adjustedAvg = landlord.reviewCount > 0 ? total / landlord.reviewCount : landlord.avgRating;

          return {
            ...landlord,
            avgRating: Number(adjustedAvg.toFixed(1)),
            address: form.address || landlord.address,
            reviews: updatedReviews,
          };
        }

        const now = new Date();
        const newReview: Review = {
          id: `r-${Date.now()}`,
          author: "You",
          school: form.school,
          date: now.toLocaleString("en-US", { month: "short", year: "numeric" }),
          rating: form.rating,
          text: form.reviewText.trim(),
          helpful: 0,
        };

        const newCount = landlord.reviewCount + 1;
        const newAverage = (landlord.avgRating * landlord.reviewCount + form.rating) / newCount;

        return {
          ...landlord,
          avgRating: Number(newAverage.toFixed(1)),
          reviewCount: newCount,
          address: form.address || landlord.address,
          reviews: [newReview, ...landlord.reviews],
        };
      });
    });

    if (resolvedLandlordId) {
      setProfileOpenId(resolvedLandlordId);
    }
    setReviewModalOpen(false);
    setEditingReview(null);
  }

  function applySurveyPreferences() {
    setSurveyApplied(true);
    setPage(1);
  }

  function clearSurveyPreferences() {
    setSurvey({ rentBudget: "any", apartmentPriority: "any", landlordPriority: "any" });
    setSurveyApplied(false);
  }

  const stats = useMemo(() => ({
    landlords: landlords.length,
    reviews: landlords.reduce((s, l) => s + l.reviewCount, 0),
    schools: new Set(landlords.map((l) => l.university)).size,
  }), [landlords]);

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

          <nav className="hidden sm:flex items-center gap-2 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveView("home")}
              className={`rounded-lg px-3 py-1.5 transition-colors ${activeView === "home" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveView("discover")}
              className={`rounded-lg px-3 py-1.5 transition-colors ${activeView === "discover" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              Discover
            </button>
          </nav>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 border border-border text-muted-foreground rounded-xl px-3 py-2 text-sm font-semibold hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <CircleHelp size={14} />
              <span className="hidden sm:inline">Help</span>
            </button>
            <button
              onClick={() => handleOpenNewReview()}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Write a Review</span>
              <span className="sm:hidden">Review</span>
            </button>
          </div>
        </div>
      </header>

      {activeView === "home" && (
        <>
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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

          <div className="mt-5 bg-white/10 border border-white/20 rounded-2xl p-4 text-left">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-['Lora'] font-semibold text-white text-lg">Quick Housing Preferences</h3>
              {surveyApplied && (
                <span className="text-xs text-emerald-300 font-medium">Applied to recommendations</span>
              )}
            </div>
            <p className="text-white/70 text-sm mb-4">Tell us what matters for your apartment and landlord. We will rank results around your preferences.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={survey.rentBudget}
                onChange={(e) => setSurvey((prev) => ({ ...prev, rentBudget: e.target.value as SurveyState["rentBudget"] }))}
                className="bg-white/95 rounded-xl px-3 py-2 text-sm"
              >
                <option value="any">Budget: Any</option>
                <option value="under_1000">Budget: Under $1,000</option>
                <option value="1000_1500">Budget: $1,000-$1,500</option>
                <option value="1500_plus">Budget: $1,500+</option>
              </select>
              <select
                value={survey.apartmentPriority}
                onChange={(e) => setSurvey((prev) => ({ ...prev, apartmentPriority: e.target.value as SurveyState["apartmentPriority"] }))}
                className="bg-white/95 rounded-xl px-3 py-2 text-sm"
              >
                <option value="any">Apartment: Any</option>
                <option value="quiet">Apartment: Quiet</option>
                <option value="modern">Apartment: Modern Unit</option>
                <option value="walkable">Apartment: Walkable Location</option>
              </select>
              <select
                value={survey.landlordPriority}
                onChange={(e) => setSurvey((prev) => ({ ...prev, landlordPriority: e.target.value as SurveyState["landlordPriority"] }))}
                className="bg-white/95 rounded-xl px-3 py-2 text-sm"
              >
                <option value="any">Landlord: Any</option>
                <option value="responsive">Landlord: Fast Repairs</option>
                <option value="fair">Landlord: Fair Policies</option>
                <option value="low_cost">Landlord: Better Value</option>
              </select>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={applySurveyPreferences}
                className="bg-white text-[#1A1209] rounded-xl px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                Apply Preferences
              </button>
              <button
                type="button"
                onClick={clearSurveyPreferences}
                className="border border-white/35 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:border-white/55 transition-colors"
              >
                Reset
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

      {/* ── Recommended Feed ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-7">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-['Lora'] font-bold text-xl text-foreground">Recommended Landlords</h2>
          <span className="text-xs text-muted-foreground">Swipe sideways</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {recommendedLandlords.map((landlord) => (
            <button
              key={`recommended-${landlord.id}`}
              type="button"
              onClick={() => setProfileOpenId(landlord.id)}
              className="min-w-[260px] max-w-[260px] snap-start text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-['Lora'] font-semibold text-foreground line-clamp-1">{landlord.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{landlord.university}</p>
                </div>
                <div className={`rounded-lg border px-2 py-1 ${ratingBg(landlord.avgRating)}`}>
                  <span className={`font-bold text-sm ${ratingColor(landlord.avgRating)}`}>{landlord.avgRating.toFixed(1)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{landlord.address}</p>
              <div className="mt-3 flex items-center justify-between">
                <StarRow rating={landlord.avgRating} size={12} />
                <span className="text-xs text-muted-foreground">{landlord.reviewCount} reviews</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Results ── */}
      <section ref={resultsRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-10 scroll-mt-20">
        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h2 className="font-['Lora'] font-bold text-xl text-foreground">
              {selectedSchool === "All Schools" ? "All Landlords" : selectedSchool}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
              {searchTerm && <span> for "<em>{searchTerm}</em>"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Rating filter pills */}
            {(["all", "good", "avg", "poor"] as const).map((f) => {
              const labels = { all: "All Ratings", good: "Good (4+)", avg: "Mid (3–4)", poor: "Below 3" };
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
                <LandlordCard
                  key={l.id}
                  landlord={l}
                  onClick={() => setProfileOpenId(l.id)}
                  isFavorite={favoriteIds.includes(l.id)}
                  onToggleFavorite={() => toggleFavorite(l.id)}
                />
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
              We're still working on it. We don't have matches yet, but new listings and reviews are being added.
            </p>
            <button
              onClick={() => handleOpenNewReview()}
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
      </>
      )}

      {activeView === "discover" && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-6">
            <h1 className="font-['Lora'] font-bold text-2xl text-foreground">Discover Landlords In Your Area</h1>
            <p className="text-sm text-muted-foreground mt-1">Landlords are ranked from highest to lowest rating.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Your Area</label>
                <input
                  type="text"
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                  placeholder="City, campus, or neighborhood"
                  className="mt-1 w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Search by Name or Location</label>
                <div className="relative mt-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={discoverQuery}
                    onChange={(e) => setDiscoverQuery(e.target.value)}
                    placeholder="Search landlords, street, city, or school"
                    className="w-full bg-input-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>

          {discoverLandlords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {discoverLandlords.map((l) => (
                <LandlordCard
                  key={`discover-${l.id}`}
                  landlord={l}
                  onClick={() => setProfileOpenId(l.id)}
                  isFavorite={favoriteIds.includes(l.id)}
                  onToggleFavorite={() => toggleFavorite(l.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-border rounded-2xl bg-card">
              <MapPin size={24} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground">We're still working on it for this area.</p>
              <p className="text-sm text-muted-foreground mt-1">Try a nearby city/campus or a broader location search.</p>
            </div>
          )}
        </section>
      )}

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
          <ProfileModal
            landlord={profileOpen}
            isFavorite={favoriteIds.includes(profileOpen.id)}
            onToggleFavorite={() => toggleFavorite(profileOpen.id)}
            onEditReview={(review) => {
              setEditingReview({ landlordId: profileOpen.id, review });
              setReviewPrefillLandlordId(profileOpen.id);
              setReviewModalOpen(true);
            }}
            onClose={() => setProfileOpenId(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {reviewModalOpen && (
          <WriteReviewModal
            landlords={landlords}
            prefillLandlord={landlords.find((l) => l.id === (editingReview?.landlordId ?? reviewPrefillLandlordId ?? ""))}
            editingReview={editingReview}
            onSubmitReview={handleSubmitReview}
            onClose={() => {
              setReviewModalOpen(false);
              setEditingReview(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {helpOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-sm"
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.2 }}
              className="bg-card w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="font-['Lora'] font-bold text-lg text-foreground">How to Use This Site</h2>
                <button onClick={() => setHelpOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4 text-sm text-foreground/80">
                <p>Use Search to filter by school, name, or address and open any landlord card for full review details.</p>
                <p>Tap the heart icon on cards or profile pages to save favorite landlords and compare options quickly.</p>
                <p>Use Write a Review to submit your own experience. If your review author shows as You, you can edit it anytime from the landlord profile.</p>
                <p>Fill out Quick Housing Preferences on the homepage to rank results by the apartment and landlord qualities you care about most.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
