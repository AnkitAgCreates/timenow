import type { TimerPreset } from '@/types/data';

/**
 * Curated, indexable timer durations. Only these slugs get pages; other
 * spellings of the same duration redirect here (see lib/data/timers.ts).
 *
 * Every preset needs a real reason to exist: a unique tagline, concrete use
 * cases and at least one question specific to the length. Slugs follow
 * timerSlugForSeconds() ("30-seconds", "25-minutes", "1-hour"); tests enforce it.
 */
export const TIMER_PRESETS: TimerPreset[] = [
  {
    slug: '30-seconds',
    seconds: 30,
    label: '30 Seconds',
    phrase: '30 seconds',
    chip: '30 sec',
    tagline: 'A half-minute countdown for quick rests, plank holds and rapid-fire rounds.',
    useCases: [
      'Rest between HIIT or Tabata efforts',
      'Hold a plank, wall sit or stretch',
      'Give each player 30 seconds to answer in a quiz or party game',
      'Swish mouthwash for the time on the bottle',
    ],
    faqs: [
      {
        question: 'Is 30 seconds long enough to rest between sets?',
        answer:
          'For short, intense intervals, 30 seconds is a common rest. For heavy strength sets most programmes suggest two to three minutes, so use the 2-minute or 3-minute timer instead.',
      },
    ],
    related: ['4-minutes', '7-minutes'],
    quickPreset: false,
    priority: 2,
    indexable: true,
  },
  {
    slug: '1-minute',
    seconds: 60,
    label: '1 Minute',
    phrase: '1 minute',
    chip: '1 min',
    tagline: 'Sixty seconds for a plank, an elevator pitch or a breathing break.',
    useCases: ['Hold a plank or a stretch', 'Practise a one-minute speech or elevator pitch', 'Take a short breathing break between tasks'],
    faqs: [
      {
        question: 'Can I repeat the 1-minute timer for intervals?',
        answer:
          'Press Reset, then Start, to run it again. If you want one alarm at the end of a whole set of intervals, set the total length instead — for example the 4-minute timer for eight 30-second efforts.',
      },
    ],
    quickPreset: true,
    priority: 2,
    indexable: true,
  },
  {
    slug: '90-seconds',
    seconds: 90,
    label: '90 Seconds',
    phrase: '90 seconds',
    chip: '90 sec',
    tagline: 'A minute and a half: the classic rest interval and a microwave-friendly countdown.',
    useCases: [
      'Rest 90 seconds between moderate strength sets',
      'Time a microwave reheat or the last stretch of a soft-boiled egg',
      'Give a 90-second pitch or improv turn',
      'Hold a demanding yoga pose',
    ],
    faqs: [
      {
        question: 'Why rest 90 seconds between sets?',
        answer:
          'Rests of 60 to 90 seconds balance recovery with keeping your heart rate up. Heavier lifts need longer rests (try the 2-minute or 3-minute timer); light circuits need shorter ones (30 seconds or 1 minute).',
      },
    ],
    related: ['30-seconds', '2-minutes'],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '2-minutes',
    seconds: 120,
    label: '2 Minutes',
    phrase: '2 minutes',
    chip: '2 min',
    tagline: 'Two minutes: the brushing time dentists recommend and a proper rest between sets.',
    useCases: ['Brush your teeth for the full two minutes dentists recommend', 'Rest between exercise sets', 'Start a task you have been putting off, then keep going'],
    faqs: [
      {
        question: 'Why do dentists recommend brushing for two minutes?',
        answer:
          'Two minutes is long enough to clean every surface of every tooth. Many electric toothbrushes buzz every 30 seconds so you move to the next quarter of your mouth; the 30-second timer does the same job.',
      },
    ],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '3-minutes',
    seconds: 180,
    label: '3 Minutes',
    phrase: '3 minutes',
    chip: '3 min',
    tagline: 'Three minutes steeps most black teas and times a boxing round.',
    useCases: ['Steep a cup of tea', 'Rest between heavy strength-training sets', 'Time each speaker in a round of short updates'],
    faqs: [
      {
        question: 'How long is a boxing round?',
        answer:
          'Professional rounds last three minutes with a one-minute rest, and most amateur rounds are three minutes too. Run this timer for the round and the 1-minute timer for the break.',
      },
    ],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '4-minutes',
    seconds: 240,
    label: '4 Minutes',
    phrase: '4 minutes',
    chip: '4 min',
    tagline: 'Four minutes covers one Tabata round, a fully steeped green tea or a one-room tidy.',
    useCases: [
      'Complete one Tabata round: eight 20-second efforts with 10-second rests',
      'Steep green or black tea to full strength',
      'Reset one room before guests arrive',
    ],
    faqs: [
      {
        question: 'How do I run Tabata with a 4-minute timer?',
        answer:
          'Start the timer and alternate 20 seconds of all-out effort with 10 seconds of rest; eight rounds fill the four minutes exactly. If you want a beep at every interval, run the 30-second timer repeatedly instead.',
      },
    ],
    related: ['30-seconds', '20-minutes'],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '5-minutes',
    seconds: 300,
    label: '5 Minutes',
    phrase: '5 minutes',
    chip: '5 min',
    tagline: 'Five minutes: the Pomodoro break, a quick tidy or a short meditation.',
    useCases: ['Take a short break between focus sessions', 'Do a quick tidy-up sprint', 'Try a short guided meditation'],
    faqs: [
      {
        question: 'Is a 5-minute break long enough?',
        answer:
          'After a 25-minute Pomodoro session, yes: stand up, stretch and look away from the screen. After four sessions take a longer break of 15 to 30 minutes.',
      },
    ],
    related: ['25-minutes', '15-minutes'],
    quickPreset: true,
    priority: 1,
    indexable: true,
  },
  {
    slug: '6-minutes',
    seconds: 360,
    label: '6 Minutes',
    phrase: '6 minutes',
    chip: '6 min',
    tagline: 'Six minutes for the six-minute walk test, a jammy soft-boiled egg or a read-aloud stretch.',
    useCases: [
      'Run the six-minute walk test used in fitness and rehabilitation assessments',
      'Soft-boil eggs to a jammy yolk',
      'Read aloud with a child for a fixed, achievable stretch',
    ],
    faqs: [
      {
        question: 'What is the six-minute walk test?',
        answer:
          'A standard assessment of how far someone can walk in six minutes on a flat course, used in rehabilitation and fitness testing. The timer lets you run it without watching a clock; you only need to measure the distance.',
      },
    ],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '7-minutes',
    seconds: 420,
    label: '7 Minutes',
    phrase: '7 minutes',
    chip: '7 min',
    tagline: 'Seven minutes: the length of the well-known bodyweight workout and a short daily meditation.',
    useCases: [
      'Run the 7-minute workout: 12 exercises, 30 seconds each, with 10-second rests',
      'Sit a short daily meditation',
      'Set a limit for choosing what to watch',
    ],
    faqs: [
      {
        question: 'What is the 7-minute workout?',
        answer:
          'A high-intensity circuit of 12 bodyweight exercises performed for 30 seconds each with 10-second rests, described in the American College of Sports Medicine’s Health & Fitness Journal in 2013. This timer covers the whole circuit; use the 30-second timer for individual exercises.',
      },
    ],
    related: ['30-seconds', '4-minutes'],
    quickPreset: false,
    priority: 2,
    indexable: true,
  },
  {
    slug: '8-minutes',
    seconds: 480,
    label: '8 Minutes',
    phrase: '8 minutes',
    chip: '8 min',
    tagline: 'Eight minutes for al dente pasta, a short core routine or a burst of unedited writing.',
    useCases: ['Cook dried pasta until al dente (check the packet time)', 'Run an eight-minute core or mobility routine', 'Write without editing for eight minutes'],
    faqs: [
      {
        question: 'Is 8 minutes right for pasta?',
        answer:
          'Most dried pasta takes 8 to 12 minutes. Start tasting a minute before the packet time, and use the 10-minute or 12-minute timer for thicker shapes.',
      },
    ],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '10-minutes',
    seconds: 600,
    label: '10 Minutes',
    phrase: '10 minutes',
    chip: '10 min',
    tagline: 'Ten minutes for a stand-up, a writing sprint or a “five more minutes” warning that really ends.',
    useCases: ['Timebox a stand-up meeting', 'Run a focused writing sprint', 'Give children a clear warning before screen time ends'],
    faqs: [
      {
        question: 'How do I keep a stand-up to ten minutes?',
        answer:
          'Start the timer as the first person speaks and stop when it rings. Anything unresolved goes into a follow-up conversation rather than extending the meeting.',
      },
    ],
    related: ['50-minutes'],
    quickPreset: true,
    priority: 1,
    indexable: true,
  },
  {
    slug: '12-minutes',
    seconds: 720,
    label: '12 Minutes',
    phrase: '12 minutes',
    chip: '12 min',
    tagline: 'Twelve minutes fits the Cooper run test, a short HIIT session or a stovetop rice simmer.',
    useCases: ['Run the 12-minute Cooper fitness test', 'Simmer white rice after it comes to the boil', 'Fit in a HIIT session on a busy day'],
    faqs: [
      {
        question: 'What is the Cooper test?',
        answer:
          'A fitness test that measures how far you can run in 12 minutes. The timer ends the test for you, so you only need to record the distance covered.',
      },
    ],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '15-minutes',
    seconds: 900,
    label: '15 Minutes',
    phrase: '15 minutes',
    chip: '15 min',
    tagline: 'A quarter of an hour: the long Pomodoro break, an inbox sweep or daily practice.',
    useCases: ['Take a longer break after several focus sessions', 'Clear your inbox without letting it take the morning', 'Practise an instrument or a language every day'],
    faqs: [
      {
        question: 'Is 15 minutes of practice a day enough?',
        answer:
          'Short daily sessions beat occasional long ones for skills such as instruments and languages. The timer keeps the habit small enough to keep up.',
      },
    ],
    related: ['25-minutes'],
    quickPreset: true,
    priority: 1,
    indexable: true,
  },
  {
    slug: '20-minutes',
    seconds: 1200,
    label: '20 Minutes',
    phrase: '20 minutes',
    chip: '20 min',
    tagline: 'Twenty minutes is the classic power-nap length and a compact workout.',
    useCases: ['Take a short nap without oversleeping', 'Do a quick home workout', 'Read a chapter before bed'],
    faqs: [
      {
        question: 'Why is 20 minutes the recommended nap length?',
        answer:
          'It is long enough to feel refreshed but short enough to avoid deep sleep, so you wake without grogginess. A 90-minute nap is the other common choice because it covers a full sleep cycle.',
      },
    ],
    related: ['90-minutes'],
    quickPreset: false,
    priority: 2,
    indexable: true,
  },
  {
    slug: '25-minutes',
    seconds: 1500,
    label: '25 Minutes',
    phrase: '25 minutes',
    chip: '25 min',
    tagline: 'The Pomodoro length: one focused work session before a five-minute break.',
    useCases: [
      'Run a Pomodoro focus session, then take a 5-minute break',
      'Study one topic without switching',
      'Roast vegetables at a high heat',
      'Clear a backlog in a timed sprint',
    ],
    faqs: [
      {
        question: 'Is a 25-minute timer the same as a Pomodoro timer?',
        answer:
          'Yes. The Pomodoro Technique uses 25-minute work sessions separated by 5-minute breaks, with a longer break after four sessions. Pair this page with the 5-minute and 15-minute timers.',
      },
      {
        question: 'How many Pomodoros fit in a working day?',
        answer:
          'A 25-minute session plus a 5-minute break takes half an hour, so a focused eight-hour day holds up to sixteen; most people plan for eight to twelve once meetings and longer breaks are included.',
      },
    ],
    related: ['5-minutes', '15-minutes', '50-minutes'],
    quickPreset: false,
    priority: 1,
    indexable: true,
  },
  {
    slug: '30-minutes',
    seconds: 1800,
    label: '30 Minutes',
    phrase: '30 minutes',
    chip: '30 min',
    tagline: 'Half an hour for a study block, a daily walk or a meeting that ends on time.',
    useCases: ['Study in a focused block', 'Go for a daily walk', 'Keep a meeting to its scheduled length'],
    faqs: [
      {
        question: 'How should I split 30 minutes of study?',
        answer: 'Try 25 minutes of focus followed by 5 minutes of review, or run the 25-minute timer and then the 5-minute timer for a short break.',
      },
    ],
    quickPreset: true,
    priority: 1,
    indexable: true,
  },
  {
    slug: '40-minutes',
    seconds: 2400,
    label: '40 Minutes',
    phrase: '40 minutes',
    chip: '40 min',
    tagline: 'Forty minutes for a lesson-length block, a tray bake or a longer yoga session.',
    useCases: ['Teach or study for one school-period block', 'Bake a tray of brownies or a loaf of banana bread', 'Do a longer yoga or strength session'],
    faqs: [
      {
        question: 'Should I use 40 or 45 minutes for a study block?',
        answer:
          'Many school periods and online classes run 40 minutes. If you want the standard exam-style block, use the 45-minute timer instead.',
      },
    ],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '45-minutes',
    seconds: 2700,
    label: '45 Minutes',
    phrase: '45 minutes',
    chip: '45 min',
    tagline: 'Forty-five minutes: a class period, a full workout or a deep-work block.',
    useCases: ['Work through a class-length study session', 'Complete a full workout', 'Set a deep-work block before your next meeting'],
    faqs: [
      {
        question: 'Why are lessons often 45 minutes?',
        answer:
          'It fits a school timetable with changeover time and is about as long as most people can focus before a break. For longer sessions, try the 50-minute or 1-hour timer.',
      },
    ],
    quickPreset: false,
    priority: 2,
    indexable: true,
  },
  {
    slug: '50-minutes',
    seconds: 3000,
    label: '50 Minutes',
    phrase: '50 minutes',
    chip: '50 min',
    tagline: 'Fifty minutes of work then ten off: the 50/10 rhythm many people prefer to shorter Pomodoros.',
    useCases: ['Work a 50/10 focus cycle', 'Run a therapy-hour or coaching session', 'Watch one episode without drifting into the next'],
    faqs: [
      {
        question: 'What is the 50/10 method?',
        answer:
          'Fifty minutes of focused work followed by a ten-minute break. It suits deep work that needs longer than a 25-minute Pomodoro to get going; run the 10-minute timer for the break.',
      },
    ],
    related: ['10-minutes', '25-minutes'],
    quickPreset: false,
    priority: 2,
    indexable: true,
  },
  {
    slug: '1-hour',
    seconds: 3600,
    label: '1 Hour',
    phrase: '1 hour',
    chip: '1 hour',
    tagline: 'One hour for deep work, a timed exam section or a screen-time limit.',
    useCases: ['Do a full deep-work or study session', 'Practise an exam section under timed conditions', 'Limit gaming or screen time', 'Get a reminder before paid parking runs out'],
    faqs: [
      {
        question: 'Can I use the 1-hour timer for exam practice?',
        answer:
          'Yes. Many exam sections are 60 minutes: start the timer as you begin and stop writing when it rings. For longer papers use the 2-hour or 3-hour timer.',
      },
    ],
    quickPreset: true,
    priority: 1,
    indexable: true,
  },
  {
    slug: '90-minutes',
    seconds: 5400,
    label: '90 Minutes',
    phrase: '90 minutes',
    chip: '90 min',
    tagline: 'An hour and a half: one full sleep cycle, a football match or a deep-work block.',
    useCases: [
      'Take a nap of one full sleep cycle',
      'Time a football match plus half-time',
      'Block out a deep-work session based on the 90-minute ultradian rhythm',
      'Proof bread dough for its first rise',
    ],
    faqs: [
      {
        question: 'Is 90 minutes a good nap length?',
        answer:
          'A 90-minute nap covers roughly one full sleep cycle, so you are less likely to wake groggy than from a 45- to 60-minute nap. A 20-minute nap is the other common choice.',
      },
    ],
    related: ['20-minutes', '1-hour'],
    quickPreset: false,
    priority: 2,
    indexable: true,
  },
  {
    slug: '2-hours',
    seconds: 7200,
    label: '2 Hours',
    phrase: '2 hours',
    chip: '2 hours',
    tagline: 'Two hours for a mock exam, a long bake or a screen-time cap.',
    useCases: ['Sit a mock exam', 'Set a limit for a long gaming or streaming session', 'Keep track of a long bake or slow-cooked meal'],
    faqs: [
      {
        question: 'What if I need 2 hours 30 minutes?',
        answer: 'Choose Custom and enter the hours, minutes and seconds you want; the timer accepts any combination.',
      },
    ],
    quickPreset: true,
    priority: 2,
    indexable: true,
  },
  {
    slug: '3-hours',
    seconds: 10800,
    label: '3 Hours',
    phrase: '3 hours',
    chip: '3 hours',
    tagline: 'Three hours for a full-length practice exam or a slow roast.',
    useCases: ['Take a full-length practice exam', 'Keep track of a slow roast', 'Plan a long study block with scheduled breaks'],
    faqs: [
      {
        question: 'Will the alarm still sound after three hours in a background tab?',
        answer:
          'The countdown stays accurate because it is calculated from the end time. Browsers may delay or mute sound in a background tab, so bring the tab forward near the end or keep it visible.',
      },
    ],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '4-hours',
    seconds: 14400,
    label: '4 Hours',
    phrase: '4 hours',
    chip: '4 hours',
    tagline: 'Four hours for a half-day deadline, a slow braise or a long study session with breaks.',
    useCases: ['Set a half-day work deadline', 'Slow-cook a braise or stew', 'Remind yourself to move after a long stretch at the desk', 'Track a parking or laundry limit'],
    faqs: [
      {
        question: 'Will a 4-hour timer keep running if I close the laptop?',
        answer:
          'The countdown is calculated from your device clock, so it shows the correct remaining time when the tab is visible again. Browsers cannot play the alarm while the device is asleep or the tab is closed, so keep the device awake for important alerts.',
      },
    ],
    related: ['12-hours'],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '5-hours',
    seconds: 18000,
    label: '5 Hours',
    phrase: '5 hours',
    chip: '5 hours',
    tagline: 'Five hours for a long work block, a pulled-pork slow cook or a road-trip leg.',
    useCases: ['Slow-cook pulled pork or beans', 'Set a limit for a long gaming session', 'Time the first half of a study day'],
    faqs: [
      {
        question: 'How do I make a 5-hour alarm reliable?',
        answer:
          'Keep the tab open and the device awake (plug it in and disable sleep). For anything critical, set a phone alarm as a backup, because web pages cannot ring when the browser is closed.',
      },
    ],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '6-hours',
    seconds: 21600,
    label: '6 Hours',
    phrase: '6 hours',
    chip: '6 hours',
    tagline: 'Six hours for a low-and-slow roast, a long exam day or fasting-window checkpoints.',
    useCases: ['Roast a brisket or lamb shoulder low and slow', 'Split a fasting window into checkpoints', 'Cap screen time on a long flight'],
    faqs: [
      {
        question: 'Is a 6-hour timer accurate over that long?',
        answer:
          'Yes. The remaining time is computed from the end time rather than by counting ticks, so it stays accurate even if the browser throttles the tab.',
      },
    ],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '8-hours',
    seconds: 28800,
    label: '8 Hours',
    phrase: '8 hours',
    chip: '8 hours',
    tagline: 'Eight hours: a working day, a full night’s sleep or an overnight slow-cooker meal.',
    useCases: ['Count down a working day or a shift', 'Run an overnight slow-cooker recipe', 'Time an eight-hour sleep window', 'Track a long-running batch job or backup'],
    faqs: [
      {
        question: 'Can I use the 8-hour timer as a sleep timer?',
        answer:
          'You can, but a phone alarm is more reliable for waking up: browsers may not play sound if the screen locks or the device sleeps. Use this page for tasks where the tab stays open.',
      },
    ],
    related: ['24-hours'],
    quickPreset: false,
    priority: 2,
    indexable: true,
  },
  {
    slug: '10-hours',
    seconds: 36000,
    label: '10 Hours',
    phrase: '10 hours',
    chip: '10 hours',
    tagline: 'Ten hours for a long shift, a sous-vide cook or a full day of travel.',
    useCases: ['Sous-vide a tough cut for ten hours', 'Track a ten-hour shift', 'Count down to a departure or a launch'],
    faqs: [
      {
        question: 'Does the 10-hour timer show hours as well as minutes?',
        answer: 'Yes. Long timers display hours, minutes and seconds (for example 09:59:59), so you can read the remaining time at a glance.',
      },
    ],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '12-hours',
    seconds: 43200,
    label: '12 Hours',
    phrase: '12 hours',
    chip: '12 hours',
    tagline: 'Twelve hours for half a day: a fasting window, an overnight soak or a 12-hour shift.',
    useCases: ['Time a 12-hour intermittent-fasting window', 'Soak beans or brine meat overnight', 'Count down a 12-hour shift'],
    faqs: [
      {
        question: 'Can I use this for a 16:8 fast?',
        answer:
          'Start this 12-hour timer at the end of your eating window and follow it with the 4-hour timer, or choose Custom and set 16 hours directly.',
      },
    ],
    related: ['4-hours', '24-hours'],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
  {
    slug: '24-hours',
    seconds: 86400,
    label: '24 Hours',
    phrase: '24 hours',
    chip: '24 hours',
    tagline: 'A full-day countdown for deadlines, 24-hour fasts and “sleep on it” decisions.',
    useCases: ['Count down to a 24-hour deadline', 'Time a 24-hour fast', 'Wait a day before a big purchase or a heated reply', 'Let paint, glue or a cure set for the full day'],
    faqs: [
      {
        question: 'Can a browser timer run for 24 hours?',
        answer:
          'Yes, as long as the tab stays open. The countdown is based on the end time, so it stays correct while the tab is in the background; only the alarm sound depends on the browser being awake at the end.',
      },
    ],
    related: ['12-hours', '8-hours'],
    quickPreset: false,
    priority: 3,
    indexable: true,
  },
];
