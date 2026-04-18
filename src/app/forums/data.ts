// Mock data for the forum prototype. All of this is placeholder content
// so we can ship a visual preview without touching the database. When
// we're happy with the look, swap these constants for live Supabase
// queries (threads + posts tables).

export interface ForumCategory {
  id: string
  title: string
  description: string
  children: SubForum[]
}

export interface SubForum {
  slug: string
  title: string
  description: string
  threads: number
  posts: number
  lastPost: {
    threadSlug: string
    threadTitle: string
    username: string
    when: string
  }
}

export interface ForumThread {
  slug: string
  title: string
  pinned?: boolean
  locked?: boolean
  replies: number
  views: number
  author: string
  createdAt: string
  lastReply: {
    username: string
    when: string
  }
}

export interface ForumPost {
  id: string
  username: string
  rank: string
  avatarColor: string
  memberSince: string
  postCount: number
  location: string
  createdAt: string
  content: string
  signature?: string
  quote?: {
    from: string
    text: string
  }
}

export const FORUM_CATEGORIES: ForumCategory[] = [
  {
    id: 'community',
    title: 'Community',
    description: 'Introductions, announcements, and general talk',
    children: [
      {
        slug: 'announcements',
        title: 'Announcements & News',
        description: 'Site news, feature drops, and scheduled maintenance. Pinned threads from the team.',
        threads: 12,
        posts: 146,
        lastPost: {
          threadSlug: 'welcome-to-the-scene',
          threadTitle: 'Welcome to The Scene — read first',
          username: 'squizzle',
          when: 'today, 9:42 AM',
        },
      },
      {
        slug: 'introductions',
        title: 'New Member Introductions',
        description: 'First post? Say hi here. Tell us what you drive and where you roll from.',
        threads: 87,
        posts: 612,
        lastPost: {
          threadSlug: 'hi-from-denver',
          threadTitle: 'Hi from Denver — 04 WRX',
          username: 'rmontoya_9eab',
          when: '38 min ago',
        },
      },
      {
        slug: 'off-topic',
        title: 'Off-Topic Lounge',
        description: 'Not about cars? Post it here. No politics, no beef, no beacons links.',
        threads: 203,
        posts: 2874,
        lastPost: {
          threadSlug: 'coffee-crew',
          threadTitle: 'Morning coffee + car photo thread',
          username: 'kbr_turbo',
          when: '2 hours ago',
        },
      },
    ],
  },
  {
    id: 'tech',
    title: 'Tech & Builds',
    description: 'Wrenching, tuning, and troubleshooting',
    children: [
      {
        slug: 'tech-talk',
        title: 'Tech Talk',
        description: 'Engine work, forced induction, suspension geometry, electrical — ask here before you break it.',
        threads: 1482,
        posts: 18209,
        lastPost: {
          threadSlug: 'ls-swap-vibration',
          threadTitle: 'LS swap vibration at 2400 RPM — help',
          username: 'brandon_ss',
          when: '7 min ago',
        },
      },
      {
        slug: 'detailing',
        title: 'Detailing & Paint',
        description: 'Ceramic, PPF, wet sanding, and the eternal quick-detailer debate.',
        threads: 298,
        posts: 3120,
        lastPost: {
          threadSlug: 'gyeon-vs-cquartz',
          threadTitle: 'Gyeon Mohs vs CQuartz UK 3.0',
          username: 'detailpaul',
          when: 'yesterday',
        },
      },
      {
        slug: 'diy-writeups',
        title: 'DIY Writeups',
        description: 'Step-by-step guides the community has written. Archive-grade threads live here.',
        threads: 74,
        posts: 812,
        lastPost: {
          threadSlug: 'rear-diff-swap-e46',
          threadTitle: 'DIY: 3.46 rear diff swap on an E46',
          username: 'mkoller_m3',
          when: '3 days ago',
        },
      },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Shows, Meets & Marketplace',
    description: 'Where we meet up and what we buy',
    children: [
      {
        slug: 'events',
        title: 'Shows & Events Chatter',
        description: 'Recap threads, photo dumps, and "who else is going" coordination.',
        threads: 412,
        posts: 5203,
        lastPost: {
          threadSlug: 'radwood-austin',
          threadTitle: 'RADwood Austin — post your pics',
          username: 'squizzle',
          when: '4 hours ago',
        },
      },
      {
        slug: 'wtb-wts',
        title: 'WTB / WTS Discussion',
        description: 'Asking and negotiating. Actual listings live in /marketplace.',
        threads: 521,
        posts: 3108,
        lastPost: {
          threadSlug: 'looking-for-volk-te37',
          threadTitle: 'WTB: Volk TE37 Saga in 18x9 +22',
          username: 'jdmlenny',
          when: '11 hours ago',
        },
      },
    ],
  },
]

// ---- Threads for the sub-forum thread-list page ----

const SAMPLE_THREADS: ForumThread[] = [
  { slug: 'forum-rules-read-first', title: 'Forum Rules — Please Read Before Posting', pinned: true, locked: true, replies: 0, views: 18429, author: 'squizzle', createdAt: '2026-04-12', lastReply: { username: 'squizzle', when: '6 days ago' } },
  { slug: 'post-count-ranks', title: 'Post Count Ranks & Profile Badges', pinned: true, replies: 24, views: 3918, author: 'squizzle', createdAt: '2026-04-13', lastReply: { username: 'brandon_ss', when: '1 day ago' } },
  { slug: 'ls-swap-vibration', title: 'LS swap vibration at 2400 RPM — help', replies: 17, views: 412, author: 'brandon_ss', createdAt: '2026-04-17', lastReply: { username: 'wrenchwayne', when: '7 min ago' } },
  { slug: 'welcome-to-the-scene', title: 'Welcome to The Scene — read first', replies: 31, views: 2104, author: 'squizzle', createdAt: '2026-04-12', lastReply: { username: 'rmontoya_9eab', when: '38 min ago' } },
  { slug: 'first-car-show-nerves', title: 'First car show tomorrow — what do I prep?', replies: 9, views: 156, author: 'devon_g7h8', createdAt: '2026-04-17', lastReply: { username: 'kbr_turbo', when: '2 hours ago' } },
  { slug: 'coilovers-vs-lowering-springs', title: 'Coilovers vs lowering springs for daily', replies: 42, views: 1203, author: 'sarah_e5f6', createdAt: '2026-04-16', lastReply: { username: 'detailpaul', when: 'yesterday' } },
  { slug: 'show-your-engine-bay', title: 'Show Your Engine Bay Thread (photo dump)', replies: 201, views: 9801, author: 'tay_i9j0', createdAt: '2026-04-14', lastReply: { username: 'marcus_c3d4', when: '2 days ago' } },
  { slug: 'dynos-near-dfw', title: 'Recommended dynos near DFW?', replies: 14, views: 388, author: 'squizzle', createdAt: '2026-04-15', lastReply: { username: 'ricky_boost', when: '2 days ago' } },
  { slug: 'best-wheel-cleaner', title: 'Best wheel cleaner that won\'t murder brake dust', replies: 28, views: 712, author: 'detailpaul', createdAt: '2026-04-13', lastReply: { username: 'wrenchwayne', when: '4 days ago' } },
]

export function getSubForum(slug: string): SubForum | null {
  for (const cat of FORUM_CATEGORIES) {
    const found = cat.children.find(c => c.slug === slug)
    if (found) return found
  }
  return null
}

export function getThreadsForForum(slug: string): ForumThread[] {
  // For prototype purposes, every sub-forum shows the same sample threads.
  return SAMPLE_THREADS
}

export function getThread(forumSlug: string, threadSlug: string): ForumThread | null {
  return SAMPLE_THREADS.find(t => t.slug === threadSlug) || null
}

export function getPostsForThread(threadSlug: string): ForumPost[] {
  // Different threads get slightly different mock conversations so Jeff
  // can click around and see variety.
  const base: ForumPost[] = [
    {
      id: '1',
      username: 'brandon_ss',
      rank: 'Veteran',
      avatarColor: '#e87817',
      memberSince: 'Oct 2024',
      postCount: 1482,
      location: 'Tulsa, OK',
      createdAt: 'Today, 10:04 AM',
      content: `Started up the car today and felt a weird vibration right around 2400 RPM under light throttle. Doesn't happen at idle. Doesn't happen above 3k. Drive train feels fine otherwise. Recently did a 6L80E rebuild so I'm wondering if the torque converter is out of balance, but before I pull everything apart I figured I'd poll the brain trust here.\n\nAny of you seen this on an LS swap? Tune is stock CPS flash, no mods beyond a cam and a full exhaust.`,
      signature: `2012 Chevy SS — LS3 cam'd + full exhaust\nAutocross DD · IG: @brandon_ss`,
    },
    {
      id: '2',
      username: 'wrenchwayne',
      rank: 'Moderator',
      avatarColor: '#1c58b8',
      memberSince: 'Jan 2023',
      postCount: 4218,
      location: 'Detroit, MI',
      createdAt: 'Today, 10:22 AM',
      quote: { from: 'brandon_ss', text: 'weird vibration right around 2400 RPM under light throttle' },
      content: `Classic torque converter unbalance signature. A 6L80E rebuild is suspect #1 — did the shop mark the TC orientation before pulling? If they reinstalled it 120° off it'll throw a harmonic right in that RPM window.\n\nQuick test: put it in neutral and rev through 2400. If the vibration disappears you're definitely looking at the converter side.`,
      signature: `Moderator — Tech & Builds\n1995 Cobra R clone · @wrenchwayne_garage`,
    },
    {
      id: '3',
      username: 'squizzle',
      rank: 'Admin · Member #1',
      avatarColor: '#7c3aed',
      memberSince: 'Apr 2026',
      postCount: 127,
      location: 'Sanger, TX',
      createdAt: 'Today, 10:48 AM',
      content: `Wayne's test is the right call. Also worth checking driveshaft balance weights — if a wheel weight got knocked off during the rebuild yank-out, that's another easy fix. Mine did the same thing and it was a 3/4oz weight that had walked off the shaft.\n\nHeads up — we added a DIY writeup section last week, if you end up diagnosing this cleanly I'd love to have it archived there for the next LS swap person.`,
      signature: `Founder · The Scene\n2010 Chevy SS · cold air + cam`,
    },
    {
      id: '4',
      username: 'brandon_ss',
      rank: 'Veteran',
      avatarColor: '#e87817',
      memberSince: 'Oct 2024',
      postCount: 1482,
      location: 'Tulsa, OK',
      createdAt: 'Today, 11:14 AM',
      content: `Just tested in neutral — vibration is gone. Going to pull the cover tomorrow and re-index the TC. Will report back. Thanks all.`,
    },
  ]
  return base
}
