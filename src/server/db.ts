import { Issue, IssueUpdate, AnalyticsData, IssueCategory, IssueSeverity, IssueStatus } from '../types';
import { calculatePriorityScore } from '../utils/priority';

// Seed coordinates clustered in an active civic district
const BASE_LAT = 37.7749;
const BASE_LNG = -122.4194;

const SEED_ISSUES: Issue[] = [
  {
    id: 'iss-1',
    title: 'Large pothole near College Gate',
    description: 'There is a large, deep pothole near the college main entrance that is causing severe hazard for two-wheelers and cyclists during rush hour.',
    category: 'road_damage',
    severity: 'high',
    ai_summary: 'Large pothole reported near College Gate creating a potential safety hazard for two-wheelers.',
    ai_severity: 'high',
    ai_confidence: 0.94,
    ai_reason: 'The report describes a significant road defect located in a high-traffic pedestrian and student vehicular corridor.',
    recommended_action: 'Dispatch road maintenance crew to inspect sub-base, mill edges, and apply hot-mix asphalt patch.',
    latitude: BASE_LAT + 0.0035,
    longitude: BASE_LNG - 0.0042,
    address: 'College Gate & University Ave',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    status: 'in_progress',
    is_anonymous: false,
    created_by: 'Rahul S. (Student Council)',
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    upvotes: 83,
    priority_score: 91,
    history: [
      {
        id: 'upd-1a',
        issue_id: 'iss-1',
        old_status: null,
        new_status: 'reported',
        comment: 'Issue reported by Rahul S. with verified photographic evidence.',
        updated_by: 'System',
        created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-1b',
        issue_id: 'iss-1',
        old_status: 'reported',
        new_status: 'in_progress',
        comment: 'Public Works Dept scheduled quick-fill asphalt unit for immediate remediation.',
        updated_by: 'M. Gomez (Municipal Roads Dept)',
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-2',
    title: 'Water leakage near Block C',
    description: 'High pressure municipal water pipe leaking onto the main walkway near Block C. Water has been continuously gushing for over 6 hours.',
    category: 'water_leakage',
    severity: 'critical',
    ai_summary: 'Severe pressurized water main rupture causing walkway flooding and resource wastage near Block C.',
    ai_severity: 'critical',
    ai_confidence: 0.96,
    ai_reason: 'Active pressurized leak causing flooding in pedestrian zone, posing foundation erosion risk.',
    recommended_action: 'Isolate valve sector 4B immediately and dispatch emergency water utility team.',
    latitude: BASE_LAT - 0.0048,
    longitude: BASE_LNG + 0.0031,
    address: 'Block C Walkway, North Sector',
    photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    status: 'reported',
    is_anonymous: true,
    created_by: 'Reported anonymously',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    upvotes: 59,
    priority_score: 86,
    history: [
      {
        id: 'upd-2a',
        issue_id: 'iss-2',
        old_status: null,
        new_status: 'reported',
        comment: 'Anonymous report submitted with GPS validation.',
        updated_by: 'Citizen',
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-3',
    title: 'Garbage accumulation at Central Market',
    description: 'Waste bins overflowing across market alleyway. Stagnant organic waste attracting pests and causing foul odor in shopping district.',
    category: 'garbage',
    severity: 'high',
    ai_summary: 'Excessive municipal waste accumulation with sanitation hazard at Central Market.',
    ai_severity: 'high',
    ai_confidence: 0.92,
    ai_reason: 'Severe sanitation risk in food market zone with rodent/pest threat.',
    recommended_action: 'Deploy solid waste compactor truck and sanitize collection station bins.',
    latitude: BASE_LAT + 0.0062,
    longitude: BASE_LNG + 0.0054,
    address: 'Central Market Lane 3',
    photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    status: 'reported',
    is_anonymous: false,
    created_by: 'K. Mehta (Merchant Assoc.)',
    created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    upvotes: 71,
    priority_score: 81,
    history: [
      {
        id: 'upd-3a',
        issue_id: 'iss-3',
        old_status: null,
        new_status: 'reported',
        comment: 'Merchant report flagged for urgent sanitation pickup.',
        updated_by: 'System',
        created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-4',
    title: 'Broken streetlight on Park Road',
    description: 'Streetlight pole #42 is unlit for three consecutive nights, creating a dark stretch along the student pedestrian path.',
    category: 'streetlight',
    severity: 'medium',
    ai_summary: 'Inoperative streetlight pole along pedestrian route reducing night-time visibility and security.',
    ai_severity: 'medium',
    ai_confidence: 0.89,
    ai_reason: 'Pedestrian safety and visibility concern along well-trafficked night path.',
    recommended_action: 'Inspect circuit breaker and replace 120W LED fixture.',
    latitude: BASE_LAT - 0.0021,
    longitude: BASE_LNG - 0.0065,
    address: 'Park Road, opposite Community Garden',
    photo_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    status: 'reported',
    is_anonymous: false,
    created_by: 'Elena Rostova',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    upvotes: 34,
    priority_score: 64,
    history: [
      {
        id: 'upd-4a',
        issue_id: 'iss-4',
        old_status: null,
        new_status: 'reported',
        comment: 'Report registered for electrical maintenance inspection.',
        updated_by: 'System',
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-5',
    title: 'Damaged footpath near Metro Station',
    description: 'Broken and dislodged concrete paving slabs near Metro Station Exit 2. Wheelchair ramp is partially obstructed.',
    category: 'infrastructure',
    severity: 'medium',
    ai_summary: 'Pedestrian pavement and wheelchair ramp degradation near busy transit terminal.',
    ai_severity: 'medium',
    ai_confidence: 0.91,
    ai_reason: 'Accessibility barrier for disabled citizens and tripping hazard during commute.',
    recommended_action: 'Re-level sub-base and replace 8 interlocking concrete paver blocks.',
    latitude: BASE_LAT + 0.0081,
    longitude: BASE_LNG - 0.0019,
    address: 'Metro Station Exit 2, Transit Plaza',
    photo_url: 'https://images.unsplash.com/photo-1578961952400-5eef022c33ff?auto=format&fit=crop&w=800&q=80',
    status: 'in_progress',
    is_anonymous: false,
    created_by: 'Carlos Mendoza',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    upvotes: 42,
    priority_score: 68,
    history: [
      {
        id: 'upd-5a',
        issue_id: 'iss-5',
        old_status: null,
        new_status: 'reported',
        comment: 'Report logged by commuter.',
        updated_by: 'Carlos Mendoza',
        created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-5b',
        issue_id: 'iss-5',
        old_status: 'reported',
        new_status: 'in_progress',
        comment: 'Transit Authority civil works team assigned work order #TA-489.',
        updated_by: 'Transit Facilities Team',
        created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-6',
    title: 'Open drainage near School Road',
    description: 'Drainage cover slab broken and fallen inside sewer trench right in front of the elementary school entrance.',
    category: 'drainage',
    severity: 'critical',
    ai_summary: 'Exposed storm-water sewer pit directly facing elementary school entry gate.',
    ai_severity: 'critical',
    ai_confidence: 0.97,
    ai_reason: 'Severe life-safety falling hazard for young children attending school.',
    recommended_action: 'Erect hazard barrier tape immediately and install heavy-duty reinforced ductile iron grate.',
    latitude: BASE_LAT - 0.0075,
    longitude: BASE_LNG - 0.0035,
    address: 'School Road, Pine Crest Academy',
    photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    status: 'in_progress',
    is_anonymous: false,
    created_by: 'School Safety Committee',
    created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    upvotes: 68,
    priority_score: 89,
    history: [
      {
        id: 'upd-6a',
        issue_id: 'iss-6',
        old_status: null,
        new_status: 'reported',
        comment: 'Flagged with high urgency by School Safety Committee.',
        updated_by: 'Safety Officer',
        created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-6b',
        issue_id: 'iss-6',
        old_status: 'reported',
        new_status: 'in_progress',
        comment: 'Temporary steel cover and safety barriers placed by emergency drainage team.',
        updated_by: 'Civil Maintenance',
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-7',
    title: 'Broken traffic signal at Junction 4',
    description: 'Traffic signals flashing erratic red in all four directions, causing severe gridlock and near-collision incidents.',
    category: 'electricity',
    severity: 'critical',
    ai_summary: 'Four-way intersection traffic signal malfunction causing vehicular gridlock and accident risk.',
    ai_severity: 'critical',
    ai_confidence: 0.95,
    ai_reason: 'Immediate vehicular and pedestrian accident hazard at high-speed crossroads.',
    recommended_action: 'Reset micro-controller relay and deploy traffic police officer for manual control.',
    latitude: BASE_LAT + 0.0051,
    longitude: BASE_LNG - 0.0072,
    address: 'Intersection 4th Ave & Liberty St',
    photo_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    status: 'in_progress',
    is_anonymous: true,
    created_by: 'Reported anonymously',
    created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    upvotes: 79,
    priority_score: 93,
    history: [
      {
        id: 'upd-7a',
        issue_id: 'iss-7',
        old_status: null,
        new_status: 'reported',
        comment: 'Report received with multiple simultaneous calls.',
        updated_by: 'System Dispatch',
        created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-7b',
        issue_id: 'iss-7',
        old_status: 'reported',
        new_status: 'in_progress',
        comment: 'Signal technicians on site replacing faulty circuit controller.',
        updated_by: 'Dept of Transportation',
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-8',
    title: 'Overflowing garbage bins at Food Street',
    description: 'Three large public waste receptacles overflowing onto the sidewalk outside evening food vendors.',
    category: 'garbage',
    severity: 'medium',
    ai_summary: 'Sidewalk waste receptacles capacity exceeded in high-density dining district.',
    ai_severity: 'medium',
    ai_confidence: 0.88,
    ai_reason: 'Commercial pedestrian waste issue requiring scheduled frequency increase.',
    recommended_action: 'Empty bins and upgrade to dual high-capacity compacting units.',
    latitude: BASE_LAT - 0.0015,
    longitude: BASE_LNG + 0.0068,
    address: 'Food Street, Heritage Market',
    photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    status: 'in_progress',
    is_anonymous: false,
    created_by: 'Amina K.',
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    upvotes: 28,
    priority_score: 58,
    history: [
      {
        id: 'upd-8a',
        issue_id: 'iss-8',
        old_status: null,
        new_status: 'reported',
        comment: 'Report created.',
        updated_by: 'Amina K.',
        created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-9',
    title: 'Waterlogged street after rainfall',
    description: 'Catch basin clogged with leaves causing 10 inches of standing water across the entire road lane.',
    category: 'drainage',
    severity: 'high',
    ai_summary: 'Storm drain obstruction causing 10-inch localized street flooding.',
    ai_severity: 'high',
    ai_confidence: 0.93,
    ai_reason: 'Hydroplaning risk and vehicle stalling danger on arterial street.',
    recommended_action: 'Deploy suction vacuum truck to clear catch basin sediment and debris.',
    latitude: BASE_LAT + 0.0022,
    longitude: BASE_LNG + 0.0041,
    address: 'Elm Street & 8th Cross',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    status: 'reported',
    is_anonymous: false,
    created_by: 'Marcus Vance',
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    upvotes: 39,
    priority_score: 74,
    history: [
      {
        id: 'upd-9a',
        issue_id: 'iss-9',
        old_status: null,
        new_status: 'reported',
        comment: 'Citizen storm drainage ticket generated.',
        updated_by: 'System',
        created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-10',
    title: 'Damaged public bench in Riverside Park',
    description: 'Wooden slats broken on central park bench with exposed rusted screws.',
    category: 'public_space',
    severity: 'low',
    ai_summary: 'Broken wooden bench slats with exposed fasteners in recreation park.',
    ai_severity: 'low',
    ai_confidence: 0.90,
    ai_reason: 'Non-critical park furniture damage without wider safety hazard.',
    recommended_action: 'Replace wood slats with weather-resistant recycled polymer timber.',
    latitude: BASE_LAT - 0.0061,
    longitude: BASE_LNG - 0.0055,
    address: 'Riverside Park, North Meadow',
    photo_url: 'https://images.unsplash.com/photo-1578961952400-5eef022c33ff?auto=format&fit=crop&w=800&q=80',
    status: 'resolved',
    is_anonymous: false,
    created_by: 'Sarah Lin',
    created_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    upvotes: 14,
    priority_score: 28,
    history: [
      {
        id: 'upd-10a',
        issue_id: 'iss-10',
        old_status: null,
        new_status: 'reported',
        comment: 'Park visitor submitted repair notice.',
        updated_by: 'Sarah Lin',
        created_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-10b',
        issue_id: 'iss-10',
        old_status: 'reported',
        new_status: 'in_progress',
        comment: 'Parks & Recreation carpentry team scheduled.',
        updated_by: 'Parks Dept',
        created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-10c',
        issue_id: 'iss-10',
        old_status: 'in_progress',
        new_status: 'resolved',
        comment: 'All bench slats replaced and safety inspected.',
        updated_by: 'Parks Team Lead J. Davis',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-11',
    title: 'Severed underground water main on 5th Avenue',
    description: 'Excavation incident cracked 6-inch water main line. Water flooded intersection.',
    category: 'water_leakage',
    severity: 'critical',
    ai_summary: 'Major cracked water main causing road inundation and local pressure loss.',
    ai_severity: 'critical',
    ai_confidence: 0.98,
    ai_reason: 'Severe infrastructure failure disrupting residential supply and traffic.',
    recommended_action: 'Emergency pipe clamp installation followed by sleeve weld replacement.',
    latitude: BASE_LAT + 0.0044,
    longitude: BASE_LNG - 0.0011,
    address: '5th Avenue & Pine Blvd',
    photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    status: 'resolved',
    is_anonymous: false,
    created_by: 'Chief Inspector Vance',
    created_at: new Date(Date.now() - 160 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    upvotes: 88,
    priority_score: 95,
    history: [
      {
        id: 'upd-11a',
        issue_id: 'iss-11',
        old_status: null,
        new_status: 'reported',
        comment: 'Emergency hotline notification.',
        updated_by: 'Water Authority',
        created_at: new Date(Date.now() - 160 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-11b',
        issue_id: 'iss-11',
        old_status: 'reported',
        new_status: 'in_progress',
        comment: 'Crews excavated and welded permanent repair sleeve.',
        updated_by: 'Water Works Dispatch',
        created_at: new Date(Date.now() - 140 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-11c',
        issue_id: 'iss-11',
        old_status: 'in_progress',
        new_status: 'resolved',
        comment: 'Pressure testing passed 90 PSI. Trench backfilled and paved.',
        updated_by: 'Lead Engineer K. Wong',
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-12',
    title: 'Flickering street light near Hospital Gate',
    description: 'Sodium lamp flickering intermittently on access road to emergency room.',
    category: 'streetlight',
    severity: 'medium',
    ai_summary: 'Intermittent lighting failure on primary hospital emergency vehicular approach.',
    ai_severity: 'medium',
    ai_confidence: 0.90,
    ai_reason: 'Visual impairment on critical emergency service corridor.',
    recommended_action: 'Replace capacitor ballast and high-output LED luminaire.',
    latitude: BASE_LAT - 0.0039,
    longitude: BASE_LNG - 0.0081,
    address: 'Hospital Emergency Gate, Health Way',
    photo_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    status: 'in_progress',
    is_anonymous: false,
    created_by: 'Dr. Anita Desai',
    created_at: new Date(Date.now() - 42 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    upvotes: 29,
    priority_score: 61,
    history: [
      {
        id: 'upd-12a',
        issue_id: 'iss-12',
        old_status: null,
        new_status: 'reported',
        comment: 'Hospital staff report received.',
        updated_by: 'Dr. Anita Desai',
        created_at: new Date(Date.now() - 42 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-12b',
        issue_id: 'iss-12',
        old_status: 'reported',
        new_status: 'in_progress',
        comment: 'Bucket truck dispatched to inspect luminaire wiring.',
        updated_by: 'City Electrician Unit 2',
        created_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-13',
    title: 'Illegal construction debris blocking sidewalk',
    description: 'Piles of drywall, masonry rubble and packaging left obstructing public footway.',
    category: 'public_space',
    severity: 'low',
    ai_summary: 'Commercial construction waste encroachment onto pedestrian right-of-way.',
    ai_severity: 'low',
    ai_confidence: 0.91,
    ai_reason: 'Pedestrian obstruction and municipal code non-compliance.',
    recommended_action: 'Issue code violation notice and order contractor removal within 24 hours.',
    latitude: BASE_LAT + 0.0071,
    longitude: BASE_LNG + 0.0028,
    address: '77 Market Boulevard',
    photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    status: 'resolved',
    is_anonymous: false,
    created_by: 'Community Watch Member',
    created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    upvotes: 19,
    priority_score: 36,
    history: [
      {
        id: 'upd-13a',
        issue_id: 'iss-13',
        old_status: null,
        new_status: 'reported',
        comment: 'Citizen complaint verified with photos.',
        updated_by: 'System',
        created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-13b',
        issue_id: 'iss-13',
        old_status: 'in_progress',
        new_status: 'resolved',
        comment: 'Contractor cleared all debris and pressure washed sidewalk.',
        updated_by: 'Code Enforcement Officer M. Stone',
        created_at: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-14',
    title: 'Deep fissure on North Bridge approach',
    description: 'Transverse pavement cracking expanding on the uphill ramp of North Bridge after freeze-thaw cycle.',
    category: 'road_damage',
    severity: 'high',
    ai_summary: 'Expanding structural asphalt crack on bridge approach ramp posing tire damage risk.',
    ai_severity: 'high',
    ai_confidence: 0.94,
    ai_reason: 'High-speed roadway approach fissure liable to water infiltration and rapid degradation.',
    recommended_action: 'Apply hot-poured elastomeric crack sealant and evaluate bridge deck transition.',
    latitude: BASE_LAT + 0.0095,
    longitude: BASE_LNG - 0.0058,
    address: 'North Bridge Ramp Northbound',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    status: 'in_progress',
    is_anonymous: false,
    created_by: 'Bridge Patrol Unit',
    created_at: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    upvotes: 47,
    priority_score: 79,
    history: [
      {
        id: 'upd-14a',
        issue_id: 'iss-14',
        old_status: null,
        new_status: 'reported',
        comment: 'Report logged by bridge patrol.',
        updated_by: 'Bridge Patrol Unit',
        created_at: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'iss-15',
    title: 'Burned out sodium streetlight lamps on Ring Road',
    description: 'Two consecutive overhead highway lamps burnt out between Mile marker 3 and 4.',
    category: 'streetlight',
    severity: 'low',
    ai_summary: 'Dual luminaire failure on secondary highway loop.',
    ai_severity: 'low',
    ai_confidence: 0.89,
    ai_reason: 'Minor illumination reduction with adjacent fixtures functioning.',
    recommended_action: 'Replace bulbs during next scheduled night-time highway maintenance.',
    latitude: BASE_LAT - 0.0088,
    longitude: BASE_LNG + 0.0042,
    address: 'Outer Ring Road, Mile 3.5',
    photo_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    status: 'resolved',
    is_anonymous: false,
    created_by: 'Highway Maintenance Log',
    created_at: new Date(Date.now() - 180 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
    upvotes: 12,
    priority_score: 25,
    history: [
      {
        id: 'upd-15a',
        issue_id: 'iss-15',
        old_status: null,
        new_status: 'reported',
        comment: 'Routine maintenance ticket.',
        updated_by: 'System',
        created_at: new Date(Date.now() - 180 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-15b',
        issue_id: 'iss-15',
        old_status: 'in_progress',
        new_status: 'resolved',
        comment: 'Fixtures replaced with modern 150W energy-efficient LEDs.',
        updated_by: 'Highway Electrician Squad',
        created_at: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
      },
    ],
  },
];

class Database {
  private issues: Issue[] = [...SEED_ISSUES];
  private votes: Set<string> = new Set(); // "issue_id:user_id"
  private activityFeed: {
    id: string;
    type: 'report' | 'upvote' | 'status_change';
    message: string;
    timestamp: string;
    issue_id: string;
    category?: IssueCategory;
  }[] = [
    {
      id: 'act-1',
      type: 'report',
      message: 'New road issue reported near College Gate',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      issue_id: 'iss-1',
      category: 'road_damage',
    },
    {
      id: 'act-2',
      type: 'upvote',
      message: 'Water leakage near Block C received 12 new upvotes',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      issue_id: 'iss-2',
      category: 'water_leakage',
    },
    {
      id: 'act-3',
      type: 'status_change',
      message: 'Streetlight issue moved to In Progress by Municipal Electric Unit',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      issue_id: 'iss-12',
      category: 'streetlight',
    },
    {
      id: 'act-4',
      type: 'status_change',
      message: 'Illegal construction debris issue marked Resolved',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      issue_id: 'iss-13',
      category: 'public_space',
    },
  ];

  getAllIssues(filters?: {
    search?: string;
    category?: string;
    status?: string;
    severity?: string;
    sort?: string;
  }): Issue[] {
    let result = [...this.issues];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (iss) =>
          iss.title.toLowerCase().includes(q) ||
          iss.description.toLowerCase().includes(q) ||
          iss.address.toLowerCase().includes(q) ||
          iss.ai_summary.toLowerCase().includes(q)
      );
    }

    if (filters?.category && filters.category !== 'all') {
      result = result.filter((iss) => iss.category === filters.category);
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter((iss) => iss.status === filters.status);
    }

    if (filters?.severity && filters.severity !== 'all') {
      result = result.filter((iss) => iss.severity === filters.severity);
    }

    if (filters?.sort === 'most_upvoted') {
      result.sort((a, b) => b.upvotes - a.upvotes);
    } else if (filters?.sort === 'highest_priority') {
      result.sort((a, b) => b.priority_score - a.priority_score);
    } else {
      // default: most recent
      result.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }

  getIssueById(id: string): Issue | undefined {
    return this.issues.find((iss) => iss.id === id);
  }

  createIssue(data: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'upvotes' | 'priority_score' | 'history'>): Issue {
    const id = `iss-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const priority = calculatePriorityScore(data.severity, 1, now);

    const initialHistory: IssueUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: id,
      old_status: null,
      new_status: 'reported',
      comment: data.is_anonymous ? 'Reported anonymously by community member.' : `Reported by ${data.created_by}.`,
      updated_by: data.is_anonymous ? 'Anonymous' : data.created_by,
      created_at: now,
    };

    const newIssue: Issue = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
      upvotes: 1,
      priority_score: priority,
      history: [initialHistory],
    };

    this.issues.unshift(newIssue);

    this.activityFeed.unshift({
      id: `act-${Date.now()}`,
      type: 'report',
      message: `New ${data.category.replace('_', ' ')} issue reported: "${data.title.substring(0, 35)}..."`,
      timestamp: now,
      issue_id: id,
      category: data.category,
    });

    return newIssue;
  }

  updateIssueStatus(
    id: string,
    newStatus: IssueStatus,
    comment?: string,
    updatedBy?: string
  ): { issue: Issue; update: IssueUpdate } | null {
    const issueIndex = this.issues.findIndex((i) => i.id === id);
    if (issueIndex === -1) return null;

    const issue = this.issues[issueIndex];
    const oldStatus = issue.status;
    const now = new Date().toISOString();

    const updateRecord: IssueUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: id,
      old_status: oldStatus,
      new_status: newStatus,
      comment: comment || `Status updated from ${oldStatus} to ${newStatus}.`,
      updated_by: updatedBy || 'Civic Authority Officer',
      created_at: now,
    };

    issue.status = newStatus;
    issue.updated_at = now;
    if (!issue.history) issue.history = [];
    issue.history.unshift(updateRecord);

    this.activityFeed.unshift({
      id: `act-${Date.now()}`,
      type: 'status_change',
      message: `Issue "${issue.title.substring(0, 30)}..." moved to ${newStatus.replace('_', ' ').toUpperCase()}`,
      timestamp: now,
      issue_id: id,
      category: issue.category,
    });

    return { issue, update: updateRecord };
  }

  voteIssue(id: string, userId: string): { success: boolean; issue?: Issue; message?: string } {
    const issue = this.issues.find((i) => i.id === id);
    if (!issue) return { success: false, message: 'Issue not found' };

    const voteKey = `${id}:${userId}`;
    if (this.votes.has(voteKey)) {
      return { success: false, issue, message: 'You have already upvoted this issue.' };
    }

    this.votes.add(voteKey);
    issue.upvotes += 1;
    issue.priority_score = calculatePriorityScore(issue.severity, issue.upvotes, issue.created_at);

    this.activityFeed.unshift({
      id: `act-${Date.now()}`,
      type: 'upvote',
      message: `Issue "${issue.title.substring(0, 30)}..." received an upvote (total: ${issue.upvotes})`,
      timestamp: new Date().toISOString(),
      issue_id: id,
      category: issue.category,
    });

    return { success: true, issue };
  }

  getAnalytics(): AnalyticsData {
    const total_reports = this.issues.length;
    const in_progress = this.issues.filter((i) => i.status === 'in_progress').length;
    const resolved = this.issues.filter((i) => i.status === 'resolved').length;
    const active_issues = this.issues.filter((i) => i.status !== 'resolved').length;
    const resolution_rate = total_reports > 0 ? Math.round((resolved / total_reports) * 100) : 0;

    // Average resolution time
    let totalDays = 0;
    let resolvedCount = 0;
    for (const iss of this.issues) {
      if (iss.status === 'resolved' && iss.history) {
        const first = iss.history[iss.history.length - 1];
        const last = iss.history.find((h) => h.new_status === 'resolved');
        if (first && last) {
          const diffMs = new Date(last.created_at).getTime() - new Date(first.created_at).getTime();
          totalDays += diffMs / (1000 * 3600 * 24);
          resolvedCount++;
        }
      }
    }
    const avg_resolution_time_days = resolvedCount > 0 ? Number((totalDays / resolvedCount).toFixed(1)) : 2.4;

    const by_category: Record<string, number> = {};
    const by_severity: Record<string, number> = {};
    const by_status: Record<string, number> = {};

    for (const iss of this.issues) {
      by_category[iss.category] = (by_category[iss.category] || 0) + 1;
      by_severity[iss.severity] = (by_severity[iss.severity] || 0) + 1;
      by_status[iss.status] = (by_status[iss.status] || 0) + 1;
    }

    // Top locations
    const locationMap: Record<string, { count: number; highSev: number }> = {};
    for (const iss of this.issues) {
      const loc = iss.address || 'Central District';
      if (!locationMap[loc]) {
        locationMap[loc] = { count: 0, highSev: 0 };
      }
      locationMap[loc].count += 1;
      if (iss.severity === 'high' || iss.severity === 'critical') {
        locationMap[loc].highSev += 1;
      }
    }

    const top_locations = Object.entries(locationMap)
      .map(([address, val]) => ({
        address,
        count: val.count,
        high_severity_count: val.highSev,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Priority queue (top 10 active issues by priority_score)
    const priority_queue = [...this.issues]
      .filter((i) => i.status !== 'resolved')
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 8);

    return {
      total_reports,
      active_issues,
      in_progress,
      resolved,
      resolution_rate,
      avg_resolution_time_days,
      by_category,
      by_severity,
      by_status,
      top_locations,
      recent_activity: this.activityFeed.slice(0, 10),
      priority_queue,
    };
  }
}

export const db = new Database();
