import { Playlist, Track } from '../types/music';

// Generated authentic album covers
export const COVER_MIDNIGHT = '/src/assets/images/spotify_cover_midnight_vibes_1792047120794.jpg';
export const COVER_LOFI = '/src/assets/images/spotify_cover_lofi_chill_1792047122251.jpg';
export const COVER_ACOUSTIC = '/src/assets/images/spotify_cover_persian_acoustic_1792047123142.jpg';
export const COVER_ELECTRONIC = '/src/assets/images/spotify_cover_electronic_pulse_1792047123839.jpg';

// Public domain & royalty-free reliable audio samples
export const MOCK_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Nocturnal Echoes',
    artist: 'Synthetic Realms',
    album: 'Midnight Pulse',
    duration: 194,
    genre: 'Electronic',
    coverUrl: COVER_MIDNIGHT,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    releaseYear: 2026,
    plays: 1420500,
    lyrics: [
      'In the quiet glow of midnight city lights',
      'Frequencies collide across electric skies',
      'Neon waves are drifting, beating in my chest',
      'Nocturnal rhythm never takes a rest',
      'Lost inside the echo, waiting for the dawn',
      'Soundwaves carry memories that were never gone'
    ],
  },
  {
    id: 'track-2',
    title: 'باران شبانه (Night Rain)',
    artist: 'سینا رحمانی (Sina Rahmani)',
    album: 'نوای جان',
    duration: 218,
    genre: 'Persian Pop',
    coverUrl: COVER_ACOUSTIC,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-abstract-intention-12099.mp3',
    releaseYear: 2025,
    plays: 980200,
    lyrics: [
      'باران می‌بارد بر پنجره‌های تاریک شهر',
      'یاد تو در هر قطره زنده می‌شود دوباره',
      'آهنگ قدیمی ساز و سکوت نیمه‌شب',
      'در کوچه‌های دلتنگی به دنبال ستاره',
      'بمان که با صدای تو شب آرام می‌گیرد',
      'دلم در این خلوت بی‌صدا جان می‌گیرد'
    ],
  },
  {
    id: 'track-3',
    title: 'Rainy Window Beats',
    artist: 'Coffee & Vinyl',
    album: 'Relax With Lofi Vol. 1',
    duration: 156,
    genre: 'Chill',
    coverUrl: COVER_LOFI,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-chill-medium-version-159456.mp3',
    releaseYear: 2026,
    plays: 2341900,
    lyrics: [
      '[Instrumental warm vinyl crackle]',
      'A warm ceramic mug on the windowsill',
      'Gentle raindrops tracing slow patterns',
      'Time slows down as chords unfold',
      'Breathing in the warmth of calm thoughts'
    ],
  },
  {
    id: 'track-4',
    title: 'Emerald Grid Techno',
    artist: 'Neon Architect',
    album: 'Emerald Grid',
    duration: 240,
    genre: 'Electronic',
    coverUrl: COVER_ELECTRONIC,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_9467657d23.mp3?filename=electronic-future-beats-117997.mp3',
    releaseYear: 2026,
    plays: 875000,
    lyrics: [
      'Basslines oscillating in geometric space',
      'Pounding four-on-the-floor underground pace',
      'Synthesizers cutting like emerald blades',
      'Dancing through the smoke and digital cascades'
    ],
  },
  {
    id: 'track-5',
    title: 'دلربا (Delroba)',
    artist: 'مهرداد پرواز (Mehrdad Parvaz)',
    album: 'آواز مهتاب',
    duration: 185,
    genre: 'Persian Pop',
    coverUrl: COVER_ACOUSTIC,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_d0c6ff1bab.mp3?filename=tuesday-glitch-10574.mp3',
    releaseYear: 2025,
    plays: 1210400,
    lyrics: [
      'ای دلربای من، از چشم تو پیدا شد بهار',
      'ساز مرا بنواز با سرانگشتان بی‌قرار',
      'در این شب مهتابی که دنیا به خواب رفته',
      'تنها صدای عشق توست که می‌ماند به یادگار'
    ],
  },
  {
    id: 'track-6',
    title: 'Cyber Skyline',
    artist: 'HyperDrive',
    album: 'Retrowave 2026',
    duration: 205,
    genre: 'Electronic',
    coverUrl: COVER_MIDNIGHT,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_24a2cb4d30.mp3?filename=the-cradle-of-your-soul-15700.mp3',
    releaseYear: 2026,
    plays: 654300,
    lyrics: [
      'Cruising down the highway in 1986',
      'Analog synthesizer memories we fix',
      'Chromium horizons, purple sunset glow',
      'Feel the bass reverb down below'
    ],
  },
  {
    id: 'track-7',
    title: 'Peaceful Study Piano',
    artist: 'Clara Fontaine',
    album: 'Nocturnes for Solitude',
    duration: 172,
    genre: 'Classical',
    coverUrl: COVER_LOFI,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=piano-moment-9835.mp3',
    releaseYear: 2024,
    plays: 3100200,
    lyrics: [
      '[Solo Concert Grand Piano]',
      'Soft hammer strikes resonate softly',
      'A calm melody of reflection and serenity',
      'Focus deepens as harmonies resolve'
    ],
  },
  {
    id: 'track-8',
    title: 'غروب کویر (Desert Sunset)',
    artist: 'گروه باد صبا (Saba Ensemble)',
    album: 'سرزمین آفتاب',
    duration: 228,
    genre: 'Acoustic',
    coverUrl: COVER_ACOUSTIC,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_88424c104e.mp3?filename=flow-21188.mp3',
    releaseYear: 2025,
    plays: 490100,
    lyrics: [
      'نوای تار در پهنه دشت‌های سرخ غروب',
      'نسیمی که از خاطره‌های دور می‌وزد',
      'آرامشی به وسعت کویر و ستارگان بی‌شمار'
    ],
  },
  {
    id: 'track-9',
    title: 'Urban Underground Flow',
    artist: 'K-Rhythm & Beats',
    album: 'City Streets Beat Tape',
    duration: 168,
    genre: 'Hip-Hop',
    coverUrl: COVER_ELECTRONIC,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c35084948a.mp3?filename=hip-hop-rock-beat-110058.mp3',
    releaseYear: 2026,
    plays: 1890000,
    lyrics: [
      'Subways rattling under heavy concrete stones',
      'Headphones on, tuned to low frequencies and tones',
      'Writing rhymes on scrap paper as trains glide by',
      'Urban heartbeat echoing up into the sky'
    ],
  },
  {
    id: 'track-10',
    title: 'Morning Espresso Bliss',
    artist: 'Café Acoustica',
    album: 'Sunday Morning Acoustic',
    duration: 195,
    genre: 'Chill',
    coverUrl: COVER_LOFI,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_c67104b901.mp3?filename=acoustic-guitar-loop-f-91bpm-10702.mp3',
    releaseYear: 2025,
    plays: 1450200,
    lyrics: [
      'Sunlight creeping through the balcony blinds',
      'Steam rising slowly from a fresh coffee grind',
      'Simple fingerstyle acoustic chords floating in the air',
      'A gentle morning without a single care'
    ],
  },
  {
    id: 'track-11',
    title: 'Midnight Drive Anthem',
    artist: 'Vapor Waveform',
    album: 'Neon Drive',
    duration: 210,
    genre: 'Pop',
    coverUrl: COVER_MIDNIGHT,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1bab.mp3?filename=tuesday-glitch-10574.mp3',
    releaseYear: 2026,
    plays: 2890400,
    lyrics: [
      'Windows rolled halfway down in the autumn breeze',
      'Bass reverberating through the city streets with ease',
      'Every stoplight looks like ruby glass tonight',
      'We run forever into the morning light'
    ],
  },
  {
    id: 'track-12',
    title: 'خواب نیلوفر (Lotus Dream)',
    artist: 'سارا پرتو (Sara Parto)',
    album: 'آینه‌های خیال',
    duration: 204,
    genre: 'Persian Pop',
    coverUrl: COVER_ACOUSTIC,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-abstract-intention-12099.mp3',
    releaseYear: 2026,
    plays: 870100,
    lyrics: [
      'بر آب زلال برکه رویاها، نیلوفری شکفت',
      'رازی که در سینه داشتم را با نسیم گفت',
      'هر شب به امید دیدنت چشم بر هم می‌نهم',
      'در باغ خیال تو تا سپیده‌دم قدم می‌زنم'
    ],
  }
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-1',
    name: 'Top Hits 2026',
    description: 'داغ‌ترین موزیک‌های روز با بیشترین پخش و انرژی بالا',
    coverUrl: COVER_MIDNIGHT,
    trackIds: ['track-1', 'track-4', 'track-9', 'track-11'],
    colorGradient: 'from-purple-900 to-black',
  },
  {
    id: 'pl-2',
    name: 'میکس شبانه و آرامش (Midnight Chill)',
    description: 'ترک‌های لوفای و آرامش‌بخش برای مطالعه و تمرکز در سکوت شب',
    coverUrl: COVER_LOFI,
    trackIds: ['track-3', 'track-7', 'track-10'],
    colorGradient: 'from-amber-950 to-black',
  },
  {
    id: 'pl-3',
    name: 'نوای اصیل و پاپ (Persian Melodies)',
    description: 'مجموعه دست‌چین‌شده از بهترین ترانه‌های پاپ و آکوستیک فارسی',
    coverUrl: COVER_ACOUSTIC,
    trackIds: ['track-2', 'track-5', 'track-8', 'track-12'],
    colorGradient: 'from-emerald-950 to-black',
  },
  {
    id: 'pl-4',
    name: 'انرژی الکترونیک و ورزش (Electronic Workout)',
    description: 'بیس‌های پرانرژی و ریتم‌های تند برای دویدن، باشگاه و کدنویسی',
    coverUrl: COVER_ELECTRONIC,
    trackIds: ['track-4', 'track-1', 'track-6', 'track-9'],
    colorGradient: 'from-green-950 to-black',
  },
];

export const GENRE_COLORS: Record<string, string> = {
  Pop: 'bg-rose-600',
  'Hip-Hop': 'bg-amber-600',
  Electronic: 'bg-emerald-600',
  Chill: 'bg-blue-600',
  Rock: 'bg-red-700',
  Acoustic: 'bg-teal-600',
  'Persian Pop': 'bg-indigo-600',
  Classical: 'bg-purple-700',
};
