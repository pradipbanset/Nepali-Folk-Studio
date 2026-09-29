"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";


type HealthResponse = {
  status: string;
  service: string;
  gpu: string;
};


type AuthUser = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};


type SongRecord = {
  id: number;
  theme: string | null;
  mood: string;
  instruments: string[];
  duration: number;
  vocal_style: string;
  lyrics: string;
  status: string;
  created_at: string;
  audio_url: string;
};


type AuthMode =
  | "login"
  | "register";


type StudioView =
  | "create"
  | "library";


type PlayerTarget =
  | {
      kind: "generated";
    }
  | {
      kind: "saved";
      songId: number;
    }
  | null;


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


const moods = [
  {
    id: "nostalgic",
    label: "सम्झना",
    english: "Nostalgic",
    icon: "◌",
  },
  {
    id: "romantic",
    label: "मायालु",
    english: "Romantic",
    icon: "♡",
  },
  {
    id: "joyful",
    label: "खुसी",
    english: "Joyful",
    icon: "✦",
  },
  {
    id: "emotional",
    label: "भावुक",
    english: "Emotional",
    icon: "◇",
  },
] as const;


const instrumentOptions = [
  {
    id: "madal",
    label: "Madal",
    nepali: "मादल",
  },
  {
    id: "sarangi",
    label: "Sarangi",
    nepali: "सारङ्गी",
  },
  {
    id: "bansuri",
    label: "Bansuri",
    nepali: "बाँसुरी",
  },
] as const;


const durations = [
  {
    seconds: 60,
    label: "1:00",
  },
  {
    seconds: 90,
    label: "1:30",
  },
  {
    seconds: 150,
    label: "2:30",
  },
] as const;


type VocalStyle =
  | "auto"
  | "male_solo"
  | "female_solo"
  | "male_female_duet"
  | "female_duet"
  | "male_duet"
  | "call_response";


const vocalOptions: {
  id: VocalStyle;
  label: string;
  nepali: string;
  description: string;
}[] = [
  {
    id: "male_solo",
    label: "Male",
    nepali: "पुरुष",
    description: "Single male folk vocal",
  },
  {
    id: "female_solo",
    label: "Female",
    nepali: "महिला",
    description: "Single female folk vocal",
  },
  {
    id: "male_female_duet",
    label: "Male + Female",
    nepali: "पुरुष + महिला",
    description: "Male and female duet",
  },
  {
    id: "female_duet",
    label: "Female Duet",
    nepali: "महिला युगल",
    description: "Two female folk voices",
  },
  {
    id: "male_duet",
    label: "Male Duet",
    nepali: "पुरुष युगल",
    description: "Two male folk voices",
  },
  {
    id: "call_response",
    label: "Dohori",
    nepali: "दोहोरी",
    description: "Call-and-response folk singing",
  },
  {
    id: "auto",
    label: "Auto",
    nepali: "स्वचालित",
    description: "Let ACE choose the vocal style",
  },
];


function formatDuration(
  seconds: number,
) {
  const minutes = Math.floor(
    seconds / 60
  );

  const remaining =
    seconds % 60;

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}


function formatDate(
  value: string,
) {
  const date = new Date(
    value
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(date);
}


function songTitle(
  song: SongRecord,
) {
  const value =
    song.theme?.trim();

  if (!value) {
    return `Nepali Folk Song #${song.id}`;
  }

  return value.length > 56
    ? `${value.slice(0, 56)}…`
    : value;
}


function moodLabel(
  moodId: string,
) {
  return (
    moods.find(
      (item) =>
        item.id === moodId
    )?.english ?? moodId
  );
}


function vocalLabel(
  vocalId: string,
) {
  return (
    vocalOptions.find(
      (item) =>
        item.id === vocalId
    )?.label ?? vocalId
  );
}



const MOTION_CSS = String.raw`
  :root {
    --folk-pointer-x: 50vw;
    --folk-pointer-y: 18rem;
  }

  html {
    scroll-behavior: smooth;
  }

  .folk-ambient {
    position: relative;
    isolation: isolate;
  }

  .folk-ambient::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(
        560px circle at var(--folk-pointer-x) var(--folk-pointer-y),
        rgba(202, 149, 62, 0.085),
        transparent 66%
      ),
      radial-gradient(
        760px circle at 14% 24%,
        rgba(128, 38, 34, 0.07),
        transparent 62%
      ),
      radial-gradient(
        640px circle at 84% 18%,
        rgba(39, 86, 59, 0.055),
        transparent 62%
      );
    opacity: 0.96;
    transition: opacity 300ms ease;
  }

  .folk-ambient::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.16;
    background-image:
      linear-gradient(rgba(201, 161, 95, 0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201, 161, 95, 0.045) 1px, transparent 1px),
      repeating-linear-gradient(
        45deg,
        transparent 0 18px,
        rgba(144, 47, 43, 0.06) 18px 20px,
        transparent 20px 38px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent 0 18px,
        rgba(92, 63, 27, 0.05) 18px 20px,
        transparent 20px 38px
      );
    background-size: 64px 64px, 64px 64px, 180px 180px, 180px 180px;
    mask-image: linear-gradient(
      180deg,
      rgba(0,0,0,0.85),
      rgba(0,0,0,0.45) 58%,
      rgba(0,0,0,0.18)
    );
  }

  .folk-ambient > * {
    z-index: 1;
  }

  .folk-nav {
    animation: folk-nav-in 700ms cubic-bezier(.2,.75,.2,1) both;
  }

  .folk-logo {
    position: relative;
    overflow: hidden;
    animation: folk-logo-breathe 4.8s ease-in-out infinite;
  }

  .folk-logo::after {
    content: "";
    position: absolute;
    inset: -70%;
    background: linear-gradient(
      115deg,
      transparent 40%,
      rgba(255,255,255,.16) 50%,
      transparent 60%
    );
    transform: translateX(-70%) rotate(10deg);
    animation: folk-logo-sheen 5.5s ease-in-out infinite;
  }

  .folk-hero {
    overflow: hidden;
  }

  .folk-hero::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 18%;
    width: 54rem;
    height: 26rem;
    transform: translateX(-50%);
    border-radius: 9999px;
    pointer-events: none;
    background:
      conic-gradient(
        from 110deg,
        transparent,
        rgba(251, 191, 36, 0.055),
        transparent 34%,
        rgba(16, 185, 129, 0.035),
        transparent 70%
      );
    filter: blur(54px);
    animation: folk-aurora 13s linear infinite;
  }

  .folk-hero-copy {
    animation: folk-copy-in 900ms cubic-bezier(.16,1,.3,1) both;
  }

  .folk-hero-title {
    text-wrap: balance;
  }

  .folk-gradient-text {
    color: transparent !important;
    background-image: linear-gradient(
      100deg,
      #f9d88f 0%,
      #fff1c7 24%,
      #d69b35 48%,
      #f7d58c 70%,
      #fff5d8 100%
    );
    background-size: 220% auto;
    -webkit-background-clip: text;
    background-clip: text;
    animation: folk-gradient-shift 7s linear infinite;
  }

  .folk-hero-card {
    transform-origin: 50% 50%;
    animation:
      folk-card-in 950ms cubic-bezier(.16,1,.3,1) 120ms both,
      folk-card-float 7s ease-in-out 1.2s infinite;
  }

  .folk-hero-card:hover {
    animation-play-state: paused;
    transform: translateY(-5px) rotateX(1deg) rotateY(-1deg);
  }

  .folk-note {
    position: absolute;
    z-index: 2;
    pointer-events: none;
    color: rgba(251, 211, 141, .34);
    text-shadow: 0 0 18px rgba(245, 158, 11, .12);
    animation: folk-note-float var(--folk-note-speed, 8s) ease-in-out infinite;
  }

  .folk-note-one {
    left: 7%;
    top: 16%;
    font-size: 1.25rem;
    --folk-note-speed: 7.5s;
  }

  .folk-note-two {
    right: 8%;
    top: 23%;
    font-size: 1.65rem;
    animation-delay: -2.7s;
    --folk-note-speed: 9.2s;
  }

  .folk-note-three {
    left: 44%;
    bottom: 9%;
    font-size: .95rem;
    animation-delay: -4.2s;
    --folk-note-speed: 10.6s;
  }

  .folk-status-dot {
    animation: folk-status-pulse 2.2s ease-out infinite;
  }

  .folk-wave-bar {
    transform-origin: center;
    animation: folk-wave 1.05s ease-in-out infinite alternate;
  }

  .folk-reveal {
    opacity: 0;
    transform: translateY(28px);
    transition:
      opacity 760ms cubic-bezier(.16,1,.3,1),
      transform 760ms cubic-bezier(.16,1,.3,1);
  }

  .folk-reveal.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  .folk-lift {
    transition:
      transform 260ms cubic-bezier(.2,.75,.2,1),
      border-color 260ms ease,
      background-color 260ms ease,
      box-shadow 260ms ease;
  }

  .folk-lift:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,.13);
    box-shadow: 0 16px 44px rgba(0,0,0,.2);
  }

  .generate-button {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    transition:
      transform 220ms cubic-bezier(.2,.75,.2,1),
      filter 220ms ease,
      box-shadow 220ms ease;
  }

  .generate-button::after {
    content: "";
    position: absolute;
    top: -120%;
    bottom: -120%;
    width: 38%;
    left: -55%;
    z-index: -1;
    transform: skewX(-18deg);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,.22),
      transparent
    );
    transition: left 650ms cubic-bezier(.2,.7,.2,1);
  }

  .generate-button:hover::after {
    left: 120%;
  }

  .generate-button:hover {
    transform: translateY(-2px);
    filter: brightness(1.07);
    box-shadow: 0 10px 32px rgba(217, 164, 65, .11);
  }

  .generate-button:active {
    transform: translateY(0) scale(.985);
  }

  .folk-track-preview {
    position: relative;
    overflow: hidden;
  }

  .folk-track-preview::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      105deg,
      transparent 10%,
      rgba(251,191,36,.035) 45%,
      transparent 72%
    );
    transform: translateX(-100%);
    animation: folk-track-sweep 6.5s ease-in-out infinite;
  }

  .folk-player {
    animation: folk-player-in 420ms cubic-bezier(.16,1,.3,1) both;
    box-shadow: 0 -18px 52px rgba(0,0,0,.28);
  }

  .folk-player::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(251,191,36,.55),
      rgba(16,185,129,.25),
      transparent
    );
    background-size: 200% 100%;
    animation: folk-player-line 5s linear infinite;
  }

  .folk-sidebar {
    animation: folk-sidebar-in 650ms cubic-bezier(.16,1,.3,1) both;
  }

  .folk-studio-content {
    animation: folk-content-in 700ms cubic-bezier(.16,1,.3,1) 80ms both;
  }

  @keyframes folk-nav-in {
    from { opacity: 0; transform: translateY(-12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes folk-copy-in {
    from { opacity: 0; transform: translateY(26px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes folk-card-in {
    from { opacity: 0; transform: translateY(30px) scale(.975); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes folk-card-float {
    0%, 100% { transform: translateY(0) rotate(.001deg); }
    50% { transform: translateY(-8px) rotate(.18deg); }
  }

  @keyframes folk-gradient-shift {
    from { background-position: 0% center; }
    to { background-position: 220% center; }
  }

  @keyframes folk-aurora {
    from { transform: translateX(-50%) rotate(0deg) scale(1); }
    50% { transform: translateX(-50%) rotate(180deg) scale(1.08); }
    to { transform: translateX(-50%) rotate(360deg) scale(1); }
  }

  @keyframes folk-note-float {
    0%, 100% { transform: translate3d(0,0,0) rotate(-6deg); opacity: .22; }
    45% { transform: translate3d(12px,-22px,0) rotate(7deg); opacity: .52; }
    70% { transform: translate3d(-5px,-10px,0) rotate(2deg); opacity: .35; }
  }

  @keyframes folk-logo-breathe {
    0%, 100% { box-shadow: 0 0 0 rgba(245, 158, 11, 0); }
    50% { box-shadow: 0 0 26px rgba(245, 158, 11, .09); }
  }

  @keyframes folk-logo-sheen {
    0%, 68% { transform: translateX(-85%) rotate(10deg); opacity: 0; }
    76% { opacity: .8; }
    90%, 100% { transform: translateX(85%) rotate(10deg); opacity: 0; }
  }

  @keyframes folk-status-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,.12); }
    50% { box-shadow: 0 0 0 7px rgba(52,211,153,0); }
  }

  @keyframes folk-wave {
    from { transform: scaleY(.46); opacity: .68; }
    to { transform: scaleY(1); opacity: 1; }
  }

  @keyframes folk-track-sweep {
    0%, 20% { transform: translateX(-110%); opacity: 0; }
    35% { opacity: 1; }
    62%, 100% { transform: translateX(110%); opacity: 0; }
  }

  @keyframes folk-player-in {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes folk-player-line {
    from { background-position: 0% 0; }
    to { background-position: 200% 0; }
  }

  @keyframes folk-sidebar-in {
    from { opacity: 0; transform: translateX(-16px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes folk-content-in {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }

    .folk-nav,
    .folk-logo,
    .folk-logo::after,
    .folk-hero-copy,
    .folk-gradient-text,
    .folk-hero-card,
    .folk-note,
    .folk-status-dot,
    .folk-wave-bar,
    .folk-track-preview::before,
    .folk-player,
    .folk-player::before,
    .folk-sidebar,
    .folk-studio-content {
      animation: none !important;
    }

    .folk-reveal {
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }

    .folk-lift,
    .generate-button {
      transition: none !important;
    }

    .folk-ambient::before {
      display: none;
    }
  }
`;


export default function Home() {
  const [
    health,
    setHealth,
  ] = useState<HealthResponse | null>(
    null
  );

  const [
    activeView,
    setActiveView,
  ] = useState<StudioView>(
    "create"
  );

  const [
    theme,
    setTheme,
  ] = useState("");

  const [
    mood,
    setMood,
  ] = useState(
    "nostalgic"
  );

  const [
    instruments,
    setInstruments,
  ] = useState<string[]>([
    "madal",
    "sarangi",
    "bansuri",
  ]);

  const [
    duration,
    setDuration,
  ] = useState(90);

  const [
    vocalStyle,
    setVocalStyle,
  ] = useState<VocalStyle>(
    "male_female_duet"
  );

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    isGeneratingLyrics,
    setIsGeneratingLyrics,
  ] = useState(false);

  const [
    generatedLyrics,
    setGeneratedLyrics,
  ] = useState("");

  const [
    isGeneratingMusic,
    setIsGeneratingMusic,
  ] = useState(false);

  const [
    audioUrl,
    setAudioUrl,
  ] = useState("");

  const [
    playerTarget,
    setPlayerTarget,
  ] = useState<PlayerTarget>(
    null
  );

  const [
    accessToken,
    setAccessToken,
  ] = useState("");

  const [
    currentUser,
    setCurrentUser,
  ] = useState<AuthUser | null>(
    null
  );

  const [
    authReady,
    setAuthReady,
  ] = useState(false);

  const [
    authMode,
    setAuthMode,
  ] = useState<AuthMode>(
    "login"
  );

  const [
    showAuthPanel,
    setShowAuthPanel,
  ] = useState(false);

  const [
    authName,
    setAuthName,
  ] = useState("");

  const [
    authEmail,
    setAuthEmail,
  ] = useState("");

  const [
    authPassword,
    setAuthPassword,
  ] = useState("");

  const [
    authNotice,
    setAuthNotice,
  ] = useState("");

  const [
    isAuthenticating,
    setIsAuthenticating,
  ] = useState(false);

  const [
    songs,
    setSongs,
  ] = useState<SongRecord[]>([]);

  const [
    isLoadingSongs,
    setIsLoadingSongs,
  ] = useState(false);

  const [
    songAudioUrls,
    setSongAudioUrls,
  ] = useState<Record<number, string>>({});

  const [
    songActionId,
    setSongActionId,
  ] = useState<number | null>(
    null
  );

  const [
    songSearch,
    setSongSearch,
  ] = useState("");

  const [
    songMoodFilter,
    setSongMoodFilter,
  ] = useState("all");


  // ============================================================
  // AUTH PANEL SCROLL RESET
  // ============================================================

  useEffect(() => {
    if (!showAuthPanel) {
      return;
    }

    // Remove any landing-page anchor such as #models so the
    // browser does not preserve that old scroll position when
    // the auth view replaces the landing page.
    const cleanUrl =
      `${window.location.pathname}${window.location.search}`;

    window.history.replaceState(
      null,
      "",
      cleanUrl
    );

    const frame = requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      // Extra safeguard for browsers that preserve document
      // scroll state across conditional React renders.
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [showAuthPanel]);


  // ============================================================
  // VISUAL MOTION / SCROLL REVEAL
  // ============================================================

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-reveal]"
      )
    );

    if (reduceMotion) {
      revealItems.forEach(
        (item) =>
          item.classList.add(
            "is-visible"
          )
      );

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              "is-visible"
            );

            observer.unobserve(
              entry.target
            );
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin:
          "0px 0px -8% 0px",
      }
    );

    revealItems.forEach(
      (item) =>
        observer.observe(item)
    );

    let frame = 0;

    const handlePointerMove = (
      event: PointerEvent,
    ) => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(
        () => {
          document.documentElement.style.setProperty(
            "--folk-pointer-x",
            `${event.clientX}px`
          );

          document.documentElement.style.setProperty(
            "--folk-pointer-y",
            `${event.clientY}px`
          );
        }
      );
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );
    };
  }, [
    authReady,
    currentUser,
    showAuthPanel,
    activeView,
    songs.length,
  ]);


  // ============================================================
  // BACKEND HEALTH
  // ============================================================

  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch(
          `${API_URL}/api/health`
        );

        if (!response.ok) {
          throw new Error(
            "Backend health check failed."
          );
        }

        const data: HealthResponse =
          await response.json();

        setHealth(data);

      } catch {
        setHealth(null);
      }
    }

    checkHealth();

    const interval = setInterval(
      checkHealth,
      10000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);


  // ============================================================
  // AUTH SESSION
  // ============================================================

  useEffect(() => {
    async function restoreSession() {
      const storedToken =
        window.localStorage.getItem(
          "nepali_folk_access_token"
        ) ?? "";

      if (!storedToken) {
        setAuthReady(true);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            headers: {
              Authorization:
                `Bearer ${storedToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            "Session expired."
          );
        }

        const user: AuthUser =
          await response.json();

        setAccessToken(storedToken);
        setCurrentUser(user);

        await fetchMySongs(
          storedToken
        );

      } catch {
        window.localStorage.removeItem(
          "nepali_folk_access_token"
        );

        setAccessToken("");
        setCurrentUser(null);

      } finally {
        setAuthReady(true);
      }
    }

    restoreSession();
  }, []);


  // ============================================================
  // AUDIO CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }
    };
  }, [audioUrl]);


  // ============================================================
  // AUTH HELPERS
  // ============================================================

  async function completeAuthSession(
    token: string,
  ) {
    const meResponse = await fetch(
      `${API_URL}/api/auth/me`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    const meData =
      await meResponse.json();

    if (!meResponse.ok) {
      throw new Error(
        meData.detail ??
          "Unable to load your account."
      );
    }

    window.localStorage.setItem(
      "nepali_folk_access_token",
      token
    );

    setAccessToken(token);
    setCurrentUser(meData);
    setAuthPassword("");
    setAuthNotice("");
    setShowAuthPanel(false);

    await fetchMySongs(token);
  }


  async function loginWithCredentials(
    email: string,
    password: string,
  ) {
    const loginResponse = await fetch(
      `${API_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      }
    );

    const loginData =
      await loginResponse.json();

    if (!loginResponse.ok) {
      throw new Error(
        loginData.detail ??
          "Login failed."
      );
    }

    const token =
      loginData.access_token as string;

    await completeAuthSession(
      token
    );
  }


  async function handleGoogleSuccess(
    response: CredentialResponse,
  ) {
    const credential =
      response.credential;

    if (!credential) {
      setAuthNotice(
        "Google did not return an authentication credential."
      );
      return;
    }

    setIsAuthenticating(true);
    setAuthNotice("");

    try {
      const googleResponse = await fetch(
        `${API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            credential,
          }),
        }
      );

      const googleData =
        await googleResponse.json();

      if (!googleResponse.ok) {
        throw new Error(
          googleData.detail ??
            "Google sign-in failed."
        );
      }

      const token =
        googleData.access_token as string;

      await completeAuthSession(
        token
      );

    } catch (error) {
      setAuthNotice(
        error instanceof Error
          ? error.message
          : "Unable to sign in with Google."
      );

    } finally {
      setIsAuthenticating(false);
    }
  }


  async function handleLogin() {
    if (
      !authEmail.trim() ||
      !authPassword
    ) {
      setAuthNotice(
        "Enter your email and password."
      );
      return;
    }

    setIsAuthenticating(true);
    setAuthNotice("");

    try {
      await loginWithCredentials(
        authEmail,
        authPassword
      );

    } catch (error) {
      setAuthNotice(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );

    } finally {
      setIsAuthenticating(false);
    }
  }


  async function handleRegister() {
    if (!authName.trim()) {
      setAuthNotice(
        "Enter your name."
      );
      return;
    }

    if (
      !authEmail.trim() ||
      !authPassword
    ) {
      setAuthNotice(
        "Enter your email and password."
      );
      return;
    }

    if (authPassword.length < 8) {
      setAuthNotice(
        "Password must be at least 8 characters."
      );
      return;
    }

    setIsAuthenticating(true);
    setAuthNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: authName.trim(),
            email: authEmail.trim(),
            password: authPassword,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Registration failed."
        );
      }

      await loginWithCredentials(
        authEmail,
        authPassword
      );

    } catch (error) {
      setAuthNotice(
        error instanceof Error
          ? error.message
          : "Unable to create your account."
      );

    } finally {
      setIsAuthenticating(false);
    }
  }


  function handleLogout() {
    window.localStorage.removeItem(
      "nepali_folk_access_token"
    );

    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );
    }

    Object.values(
      songAudioUrls
    ).forEach((url) => {
      URL.revokeObjectURL(url);
    });

    setAccessToken("");
    setCurrentUser(null);
    setSongs([]);
    setSongAudioUrls({});
    setAudioUrl("");
    setPlayerTarget(null);
    setGeneratedLyrics("");
    setNotice("");
    setAuthPassword("");
    setActiveView("create");
  }


  function handleUnauthorized() {
    handleLogout();

    setAuthNotice(
      "Your session expired. Please sign in again."
    );
  }


  // ============================================================
  // SONG LIBRARY
  // ============================================================

  async function fetchMySongs(
    tokenOverride?: string,
  ) {
    const token =
      tokenOverride ?? accessToken;

    if (!token) {
      return [] as SongRecord[];
    }

    setIsLoadingSongs(true);

    try {
      const response = await fetch(
        `${API_URL}/api/songs`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return [] as SongRecord[];
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to load your songs."
        );
      }

      const nextSongs =
        data as SongRecord[];

      setSongs(nextSongs);

      return nextSongs;

    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to load your songs."
      );

      return [] as SongRecord[];

    } finally {
      setIsLoadingSongs(false);
    }
  }


  async function loadSavedSongAudio(
    song: SongRecord,
  ) {
    if (!accessToken) {
      handleUnauthorized();
      return;
    }

    const existingUrl =
      songAudioUrls[song.id];

    if (existingUrl) {
      setPlayerTarget({
        kind: "saved",
        songId: song.id,
      });
      return;
    }

    setSongActionId(song.id);

    try {
      const response = await fetch(
        `${API_URL}${song.audio_url}`,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Unable to load this song."
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(blob);

      setSongAudioUrls(
        (current) => ({
          ...current,
          [song.id]: url,
        })
      );

      setPlayerTarget({
        kind: "saved",
        songId: song.id,
      });

    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to load this song."
      );

    } finally {
      setSongActionId(null);
    }
  }


  async function downloadSavedSong(
    song: SongRecord,
  ) {
    if (!accessToken) {
      handleUnauthorized();
      return;
    }

    setSongActionId(song.id);

    try {
      const response = await fetch(
        `${API_URL}${song.audio_url}`,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Unable to download this song."
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        `nepali-folk-${song.id}.wav`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to download this song."
      );

    } finally {
      setSongActionId(null);
    }
  }


  async function deleteSavedSong(
    song: SongRecord,
  ) {
    if (!accessToken) {
      handleUnauthorized();
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this generated song?"
      );

    if (!confirmed) {
      return;
    }

    setSongActionId(song.id);

    try {
      const response = await fetch(
        `${API_URL}/api/songs/${song.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        let message =
          "Unable to delete this song.";

        try {
          const data =
            await response.json();

          message =
            data.detail ?? message;
        } catch {
          // Use fallback message.
        }

        throw new Error(message);
      }

      const existingUrl =
        songAudioUrls[song.id];

      if (existingUrl) {
        URL.revokeObjectURL(
          existingUrl
        );
      }

      setSongAudioUrls(
        (current) => {
          const next = {
            ...current,
          };

          delete next[song.id];
          return next;
        }
      );

      setSongs(
        (current) =>
          current.filter(
            (item) =>
              item.id !== song.id
          )
      );

      if (
        playerTarget?.kind ===
          "saved" &&
        playerTarget.songId ===
          song.id
      ) {
        setPlayerTarget(null);
      }

      setNotice(
        "Song deleted from your library."
      );

    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to delete this song."
      );

    } finally {
      setSongActionId(null);
    }
  }


  // ============================================================
  // STUDIO HELPERS
  // ============================================================

  function toggleInstrument(
    instrument: string,
  ) {
    setInstruments(
      (current) => {
        if (
          current.includes(
            instrument
          )
        ) {
          return current.filter(
            (item) =>
              item !== instrument
          );
        }

        return [
          ...current,
          instrument,
        ];
      }
    );
  }


  function startNewSong() {
    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );
    }

    setTheme("");
    setMood("nostalgic");
    setInstruments([
      "madal",
      "sarangi",
      "bansuri",
    ]);
    setDuration(90);
    setVocalStyle(
      "male_female_duet"
    );
    setGeneratedLyrics("");
    setAudioUrl("");
    setPlayerTarget(null);
    setNotice(
      "A fresh song workspace is ready."
    );
    setActiveView("create");
  }


  function useSongInStudio(
    song: SongRecord,
  ) {
    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );
    }

    const nextVocalStyle =
      vocalOptions.some(
        (item) =>
          item.id ===
          song.vocal_style
      )
        ? (song.vocal_style as VocalStyle)
        : "auto";

    setTheme(
      song.theme ?? ""
    );
    setMood(song.mood);
    setInstruments(
      song.instruments
    );
    setDuration(song.duration);
    setVocalStyle(
      nextVocalStyle
    );
    setGeneratedLyrics(
      song.lyrics
    );
    setAudioUrl("");
    setNotice(
      `Song #${song.id} is loaded in Create. Edit it or generate a new version.`
    );
    setActiveView("create");
  }


  // ============================================================
  // GENERATE LYRICS
  // ============================================================

  async function handleGenerateLyrics() {
    if (!theme.trim()) {
      setNotice(
        "Write a short idea for your song first."
      );
      return;
    }

    if (instruments.length === 0) {
      setNotice(
        "Select at least one traditional instrument."
      );
      return;
    }

    if (!accessToken) {
      handleUnauthorized();
      return;
    }

    setIsGeneratingLyrics(true);
    setGeneratedLyrics("");

    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );
      setAudioUrl("");
    }

    if (
      playerTarget?.kind ===
      "generated"
    ) {
      setPlayerTarget(null);
    }

    setNotice(
      "Gemma is writing your Nepali lyrics..."
    );

    try {
      const response = await fetch(
        `${API_URL}/api/lyrics`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            theme: theme.trim(),
            mood,
            instruments,
            duration,
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Lyrics generation failed."
        );
      }

      setGeneratedLyrics(
        data.lyrics
      );

      setNotice(
        "Lyrics are ready. Review them before creating the full song."
      );

    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to generate lyrics."
      );

    } finally {
      setIsGeneratingLyrics(false);
    }
  }


  // ============================================================
  // GENERATE MUSIC
  // ============================================================

  async function handleGenerateMusic() {
    if (!generatedLyrics.trim()) {
      setNotice(
        "Generate or write the lyrics before creating music."
      );
      return;
    }

    if (instruments.length === 0) {
      setNotice(
        "Select at least one traditional instrument."
      );
      return;
    }

    if (!accessToken) {
      handleUnauthorized();
      return;
    }

    setIsGeneratingMusic(true);
    setNotice(
      "ACE-Step is creating the vocal and folk arrangement..."
    );

    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );
      setAudioUrl("");
    }

    try {
      const response = await fetch(
        `${API_URL}/api/music`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            theme: theme.trim(),
            lyrics:
              generatedLyrics.trim(),
            mood,
            instruments,
            duration,
            vocal_style:
              vocalStyle,
          }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const contentType =
          response.headers.get(
            "content-type"
          ) ?? "";

        let errorMessage =
          "Music generation failed.";

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          const errorData =
            await response.json();

          errorMessage =
            errorData.detail ??
            errorMessage;
        } else {
          const errorText =
            await response.text();

          if (errorText) {
            errorMessage =
              errorText;
          }
        }

        throw new Error(
          errorMessage
        );
      }

      const audioBlob =
        await response.blob();

      if (audioBlob.size === 0) {
        throw new Error(
          "The music service returned an empty audio file."
        );
      }

      const newAudioUrl =
        URL.createObjectURL(
          audioBlob
        );

      setAudioUrl(
        newAudioUrl
      );
      setPlayerTarget({
        kind: "generated",
      });

      await fetchMySongs();

      setNotice(
        "Your Nepali folk song is ready and saved to your Library."
      );

    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to generate music."
      );

    } finally {
      setIsGeneratingMusic(false);
    }
  }


  // ============================================================
  // COMPUTED UI STATE
  // ============================================================

  const backendOnline =
    health?.status === "ok";

  const gpuOnline =
    health?.gpu === "online";

  const isBusy =
    isGeneratingLyrics ||
    isGeneratingMusic;

  const firstName =
    currentUser?.name
      .trim()
      .split(/\s+/)[0] ??
    "Creator";

  const filteredSongs = useMemo(
    () => {
      const query =
        songSearch
          .trim()
          .toLowerCase();

      return songs.filter(
        (song) => {
          const moodMatches =
            songMoodFilter ===
              "all" ||
            song.mood ===
              songMoodFilter;

          const searchable = [
            song.theme ?? "",
            song.mood,
            song.vocal_style,
            song.instruments.join(" "),
            song.lyrics,
          ]
            .join(" ")
            .toLowerCase();

          const queryMatches =
            !query ||
            searchable.includes(
              query
            );

          return (
            moodMatches &&
            queryMatches
          );
        }
      );
    },
    [
      songs,
      songSearch,
      songMoodFilter,
    ]
  );

  const recentSongs =
    songs.slice(0, 4);

  const playerSong =
    playerTarget?.kind ===
    "saved"
      ? songs.find(
          (song) =>
            song.id ===
            playerTarget.songId
        ) ?? null
      : null;

  const playerSrc =
    playerTarget?.kind ===
    "generated"
      ? audioUrl
      : playerSong
        ? songAudioUrls[
            playerSong.id
          ] ?? ""
        : "";

  const playerTitle =
    playerTarget?.kind ===
    "generated"
      ? theme.trim() ||
        "Studio preview"
      : playerSong
        ? songTitle(playerSong)
        : "";

  const playerMeta =
    playerTarget?.kind ===
    "generated"
      ? `${moodLabel(mood)} • ${vocalLabel(vocalStyle)} • ${formatDuration(duration)}`
      : playerSong
        ? `${moodLabel(playerSong.mood)} • ${vocalLabel(playerSong.vocal_style)} • ${formatDuration(playerSong.duration)}`
        : "";


  // ============================================================
  // SESSION LOADING
  // ============================================================

  if (!authReady) {
    return (
      <main
        className="
          studio-grid
          flex
          min-h-screen
          items-center
          justify-center
          px-5
        "
      >
        <div
          className="
            glass-panel
            rounded-[28px]
            px-8
            py-10
            text-center
          "
        >
          <div
            className="
              mx-auto
              mb-4
              h-8
              w-8
              animate-spin
              rounded-full
              border-2
              border-amber-200/20
              border-t-amber-200
            "
          />

          <p
            className="
              text-sm
              text-neutral-400
            "
          >
            Restoring your studio session...
          </p>
        </div>
      </main>
    );
  }


  // ============================================================
  // LOGIN / REGISTER
  // ============================================================

  if (
    !currentUser ||
    !accessToken
  ) {
    if (showAuthPanel) {
      return (
        <main
          className="
            folk-ambient
            studio-grid
            relative
            min-h-screen
            overflow-x-hidden
            px-5
            py-6
            sm:px-8
            lg:py-8
          "
        >
          <style>{MOTION_CSS}</style>
  
          <button
            type="button"
            onClick={() =>
              setShowAuthPanel(false)
            }
            className="
              absolute
              left-5
              top-5
              z-20
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-white/8
              bg-black/30
              px-4
              py-2
              text-xs
              text-neutral-300
              backdrop-blur-xl
              transition
              hover:border-white/15
              hover:bg-white/[0.05]
              hover:text-white
              sm:left-8
              sm:top-8
            "
          >
            ← Back to home
          </button>
  
          <div
            className="
              pointer-events-none
              absolute
              -left-40
              top-24
              h-96
              w-96
              rounded-full
              bg-emerald-900/10
              blur-3xl
            "
          />
  
          <div
            className="
              pointer-events-none
              absolute
              -right-40
              top-0
              h-[28rem]
              w-[28rem]
              rounded-full
              bg-amber-700/10
              blur-3xl
            "
          />
  
          <div
            className="
              relative
              z-10
              mx-auto
              grid
              w-full
              max-w-6xl
              gap-10
              pt-16
              pb-8
              sm:pt-20
              lg:grid-cols-[1.05fr_0.75fr]
              lg:items-start
              lg:gap-14
              lg:pt-16
              lg:pb-10
            "
          >
            <section
              className="
                hidden
                lg:block
                lg:pt-2
              "
            >
              <div
                className="
                  mb-6
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-amber-200/15
                    bg-amber-100/10
                    text-xl
                    font-semibold
                    text-amber-200
                  "
                >
                  धु
                </div>
  
                <div>
                  <p
                    className="
                      font-semibold
                      text-white
                    "
                  >
                    Nepali Folk Studio
                  </p>
  
                  <p
                    className="
                      text-xs
                      text-neutral-500
                    "
                  >
                    AI-powered Nepali folk creation
                  </p>
                </div>
              </div>
  
              <h1
                className="
                  max-w-2xl
                  text-5xl
                  font-semibold
                  leading-[1.05]
                  tracking-[-0.05em]
                  text-white
                "
              >
                Turn an idea into an original{" "}
                <span className="gold-text">
                  Nepali folk song.
                </span>
              </h1>
  
              <p
                className="
                  mt-5
                  max-w-xl
                  text-base
                  leading-8
                  text-neutral-400
                "
              >
                Write a story, generate Nepali lyrics with Gemma, then create the vocal and traditional folk arrangement with ACE-Step.
              </p>
  
              <div
                className="
                  mt-8
                  grid
                  max-w-xl
                  grid-cols-3
                  gap-3
                "
              >
                {[
                  ["01", "Write", "Describe your story"],
                  ["02", "Shape", "Edit lyrics & style"],
                  ["03", "Create", "Generate full audio"],
                ].map(
                  ([number, title, text]) => (
                    <div
                      key={number}
                      className="
                        rounded-2xl
                        border
                        border-white/7
                        bg-white/[0.025]
                        p-4
                      "
                    >
                      <p
                        className="
                          text-[11px]
                          text-amber-200/60
                        "
                      >
                        {number}
                      </p>
                      <p
                        className="
                          mt-3
                          text-sm
                          font-medium
                          text-white
                        "
                      >
                        {title}
                      </p>
                      <p
                        className="
                          mt-1
                          text-xs
                          leading-5
                          text-neutral-600
                        "
                      >
                        {text}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
  
            <section
              className="
                glass-panel
                folk-lift
                mx-auto
                w-full
                max-w-[420px]
                rounded-[28px]
                p-6
                sm:p-7
                lg:mt-0
              "
            >
              <div
                className="
                  mb-6
                  flex
                  items-center
                  gap-3
                  lg:hidden
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-amber-200/15
                    bg-amber-100/10
                    text-lg
                    text-amber-200
                  "
                >
                  धु
                </div>
                <div>
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-white
                    "
                  >
                    Nepali Folk Studio
                  </p>
                  <p
                    className="
                      text-xs
                      text-neutral-500
                    "
                  >
                    Your personal AI music studio
                  </p>
                </div>
              </div>
  
              <p
                className="
                  text-xs
                  tracking-[0.18em]
                  text-amber-300/65
                  uppercase
                "
              >
                {authMode === "login"
                  ? "Welcome back"
                  : "Join the studio"}
              </p>
  
              <h2
                className="
                  mt-2
                  text-3xl
                  font-semibold
                  tracking-tight
                  text-white
                "
              >
                {authMode === "login"
                  ? "Sign in"
                  : "Create an account"}
              </h2>
  
              <div
                className="
                  mt-5
                  grid
                  grid-cols-2
                  rounded-xl
                  border
                  border-white/7
                  bg-black/20
                  p-1
                "
              >
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthNotice("");
                  }}
                  className={`
                    rounded-lg
                    px-4
                    py-2.5
                    text-sm
                    transition
                    ${
                      authMode === "login"
                        ? "bg-white/8 text-white"
                        : "text-neutral-500"
                    }
                  `}
                >
                  Sign in
                </button>
  
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthNotice("");
                  }}
                  className={`
                    rounded-lg
                    px-4
                    py-2.5
                    text-sm
                    transition
                    ${
                      authMode === "register"
                        ? "bg-white/8 text-white"
                        : "text-neutral-500"
                    }
                  `}
                >
                  Register
                </button>
              </div>
  
              <div
                className="
                  mt-5
                  space-y-3.5
                "
              >
                {authMode === "register" && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="
                        mb-2
                        block
                        text-xs
                        text-neutral-400
                      "
                    >
                      Name
                    </label>
                    <input
                      id="auth-name"
                      value={authName}
                      onChange={(event) =>
                        setAuthName(
                          event.target.value
                        )
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-white/8
                        bg-black/20
                        px-4
                        py-3.5
                        text-sm
                        text-white
                        outline-none
                        placeholder:text-neutral-600
                        focus:border-amber-300/25
                      "
                      placeholder="Your name"
                    />
                  </div>
                )}
  
                <div>
                  <label
                    htmlFor="auth-email"
                    className="
                      mb-2
                      block
                      text-xs
                      text-neutral-400
                    "
                  >
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={authEmail}
                    onChange={(event) =>
                      setAuthEmail(
                        event.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-white/8
                      bg-black/20
                      px-4
                      py-3.5
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-neutral-600
                      focus:border-amber-300/25
                    "
                    placeholder="you@example.com"
                  />
                </div>
  
                <div>
                  <label
                    htmlFor="auth-password"
                    className="
                      mb-2
                      block
                      text-xs
                      text-neutral-400
                    "
                  >
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={authPassword}
                    onChange={(event) =>
                      setAuthPassword(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        if (
                          authMode === "login"
                        ) {
                          handleLogin();
                        } else {
                          handleRegister();
                        }
                      }
                    }}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-white/8
                      bg-black/20
                      px-4
                      py-3.5
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-neutral-600
                      focus:border-amber-300/25
                    "
                    placeholder={
                      authMode === "register"
                        ? "At least 8 characters"
                        : "Your password"
                    }
                  />
                </div>
  
                {authNotice && (
                  <div
                    className="
                      rounded-xl
                      border
                      border-amber-300/10
                      bg-amber-300/[0.04]
                      px-4
                      py-3
                      text-xs
                      leading-5
                      text-amber-100/80
                    "
                  >
                    {authNotice}
                  </div>
                )}
  
                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={
                    authMode === "login"
                      ? handleLogin
                      : handleRegister
                  }
                  className="
                    generate-button
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    px-5
                    py-3.5
                    text-sm
                    font-semibold
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {isAuthenticating
                    ? "Please wait..."
                    : authMode === "login"
                      ? "Enter Studio →"
                      : "Create Account →"}
                </button>

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    py-1
                  "
                >
                  <div
                    className="
                      h-px
                      flex-1
                      bg-white/8
                    "
                  />
                  <span
                    className="
                      text-[11px]
                      uppercase
                      tracking-[0.16em]
                      text-neutral-600
                    "
                  >
                    or
                  </span>
                  <div
                    className="
                      h-px
                      flex-1
                      bg-white/8
                    "
                  />
                </div>

                <div
                  className={`
                    flex
                    w-full
                    justify-center
                    overflow-hidden
                    rounded-xl
                    ${
                      isAuthenticating
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  `}
                >
                  <GoogleLogin
                    onSuccess={
                      handleGoogleSuccess
                    }
                    onError={() => {
                      setAuthNotice(
                        "Google sign-in was cancelled or failed."
                      );
                    }}
                    theme="filled_black"
                    size="large"
                    shape="rectangular"
                    text="continue_with"
                    logo_alignment="left"
                    width="360"
                  />
                </div>

                <p
                  className="
                    text-center
                    text-[11px]
                    leading-5
                    text-neutral-600
                  "
                >
                  Continue securely with your Google account.
                </p>
              </div>
            </section>
          </div>
        </main>
      );
    }


    return (
      <main
        className="
          folk-ambient
          studio-grid
          min-h-screen
          overflow-hidden
          bg-[#080808]
          text-white
        "
      >
        <style>{MOTION_CSS}</style>
        <header
          className="
            folk-nav
            sticky
            top-0
            z-40
            border-b
            border-white/6
            bg-[#080808]/85
            backdrop-blur-2xl
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[1440px]
              items-center
              justify-between
              gap-4
              px-5
              py-4
              sm:px-8
              lg:px-10
            "
          >
            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              className="
                flex
                items-center
                gap-3
                text-left
              "
            >
              <span
                className="
                  folk-logo
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-amber-200/15
                  bg-amber-100/[0.08]
                  text-lg
                  font-semibold
                  text-amber-200
                "
              >
                धु
              </span>

              <span>
                <span
                  className="
                    block
                    text-sm
                    font-semibold
                    tracking-wide
                    text-white
                  "
                >
                  Nepali Folk Studio
                </span>

                <span
                  className="
                    hidden
                    text-[11px]
                    text-neutral-600
                    sm:block
                  "
                >
                  लोक संगीत प्रयोगशाला · AI folk creation
                </span>
              </span>
            </button>

            <nav
              className="
                hidden
                items-center
                gap-7
                text-sm
                text-neutral-400
                md:flex
              "
            >
              <a
                href="#how-it-works"
                className="
                  transition
                  hover:text-white
                "
              >
                How it works
              </a>

              <a
                href="#features"
                className="
                  transition
                  hover:text-white
                "
              >
                Features
              </a>

              <a
                href="#models"
                className="
                  transition
                  hover:text-white
                "
              >
                Models
              </a>
            </nav>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthNotice("");
                  setShowAuthPanel(true);
                }}
                className="
                  rounded-full
                  px-4
                  py-2.5
                  text-sm
                  text-neutral-300
                  transition
                  hover:bg-white/[0.05]
                  hover:text-white
                "
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthNotice("");
                  setShowAuthPanel(true);
                }}
                className="
                  generate-button
                  rounded-full
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                "
              >
                Start creating
              </button>
            </div>
          </div>
        </header>

        <section
          className="
            folk-hero
            relative
            border-b
            border-white/5
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -left-40
              top-20
              h-[30rem]
              w-[30rem]
              rounded-full
              bg-emerald-900/10
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -right-32
              top-0
              h-[34rem]
              w-[34rem]
              rounded-full
              bg-amber-700/10
              blur-3xl
            "
          />

          <span
            aria-hidden="true"
            className="folk-note folk-note-one"
          >
            ♪
          </span>

          <span
            aria-hidden="true"
            className="folk-note folk-note-two"
          >
            ♫
          </span>

          <span
            aria-hidden="true"
            className="folk-note folk-note-three"
          >
            ✦
          </span>

          <div
            className="
              relative
              mx-auto
              grid
              max-w-[1440px]
              items-center
              gap-14
              px-5
              py-20
              sm:px-8
              sm:py-24
              lg:grid-cols-[0.9fr_1.1fr]
              lg:px-10
              lg:py-28
            "
          >
            <div className="folk-hero-copy">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-amber-200/10
                  bg-amber-100/[0.04]
                  px-4
                  py-2
                  text-xs
                  tracking-[0.16em]
                  text-amber-200/75
                  uppercase
                "
              >
                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-emerald-400
                  "
                />
                आफ्नो कथा • आफ्नै लोकधुन
              </div>

              <p
                className="
                  mt-6
                  text-sm
                  tracking-[0.14em]
                  text-amber-100/70
                  sm:text-base
                "
              >
                आफ्नै कथा, आफ्नै लोकधुन।
              </p>

              <h1
                className="
                  folk-hero-title
                  mt-5
                  max-w-3xl
                  text-5xl
                  font-semibold
                  leading-[1.02]
                  tracking-[-0.055em]
                  text-white
                  sm:text-6xl
                  lg:text-7xl
                "
              >
                Turn your story into
                <span
                  className="
                    gold-text
                    folk-gradient-text
                    block
                  "
                >
                  living Nepali folk music.
                </span>
              </h1>

              <p
                className="
                  mt-7
                  max-w-xl
                  text-base
                  leading-7
                  text-neutral-300
                  sm:text-lg
                "
              >
                Start from a memory, a village path,
                a love story, a season or a place.
                Create Nepali lyrics, shape them with
                folk instruments and vocals, then turn
                them into an original lok geet through
                your fine-tuned AI pipeline.
              </p>

              <div
                className="
                  mt-9
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthNotice("");
                    setShowAuthPanel(true);
                  }}
                  className="
                    generate-button
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    px-6
                    py-3.5
                    text-sm
                    font-semibold
                  "
                >
                  ✦ Create your first lok geet
                </button>

                <a
                  href="#how-it-works"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    border
                    border-white/8
                    bg-white/[0.025]
                    px-6
                    py-3.5
                    text-sm
                    text-neutral-300
                    transition
                    hover:border-white/15
                    hover:bg-white/[0.05]
                    hover:text-white
                  "
                >
                  Explore the process
                  <span>↓</span>
                </a>
              </div>

              <div
                className="
                  mt-10
                  flex
                  flex-wrap
                  gap-3
                "
              >
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/7
                    bg-white/[0.025]
                    px-3.5
                    py-2
                    text-xs
                    text-neutral-500
                  "
                >
                  <span
                    className={`
                      folk-status-dot
                      h-2
                      w-2
                      rounded-full
                      ${
                        backendOnline
                          ? "bg-emerald-400"
                          : "bg-red-400"
                      }
                    `}
                  />
                  Backend
                  <span className="text-neutral-300">
                    {backendOnline
                      ? "Online"
                      : "Offline"}
                  </span>
                </div>

                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/7
                    bg-white/[0.025]
                    px-3.5
                    py-2
                    text-xs
                    text-neutral-500
                  "
                >
                  <span
                    className={`
                      folk-status-dot
                      h-2
                      w-2
                      rounded-full
                      ${
                        gpuOnline
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                      }
                    `}
                  />
                  Music engine
                  <span className="text-neutral-300">
                    {gpuOnline
                      ? "Ready"
                      : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="
                folk-hero-card
                relative
                mx-auto
                w-full
                max-w-2xl
              "
            >
              <div
                className="
                  absolute
                  -inset-5
                  rounded-[36px]
                  bg-amber-300/[0.025]
                  blur-2xl
                "
              />

              <div
                className="
                  glass-panel
                  relative
                  overflow-hidden
                  rounded-[30px]
                  border
                  border-white/8
                  bg-[#101010]/95
                  p-4
                  sm:p-5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    border-b
                    border-white/6
                    pb-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-xs
                        tracking-[0.16em]
                        text-neutral-600
                        uppercase
                      "
                    >
                      लोक रचना
                    </p>
                    <p
                      className="
                        mt-1
                        text-sm
                        font-medium
                        text-white
                      "
                    >
                      Studio preview
                    </p>
                  </div>

                  <div
                    className="
                      rounded-full
                      border
                      border-emerald-300/10
                      bg-emerald-300/[0.04]
                      px-3
                      py-1.5
                      text-[11px]
                      text-emerald-300
                    "
                  >
                    लोक धुन
                  </div>
                </div>

                <div
                  className="
                    mt-4
                    rounded-2xl
                    border
                    border-white/7
                    bg-black/25
                    p-5
                  "
                >
                  <p
                    className="
                      text-xs
                      text-neutral-600
                    "
                  >
                    कथाको बीउ · Story seed
                  </p>

                  <p
                    className="
                      mt-3
                      text-sm
                      leading-6
                      text-neutral-200
                    "
                  >
                    After many years away, a young
                    man returns to his hill village
                    and rediscovers the people,
                    footpaths and melodies that once
                    shaped his childhood.
                  </p>
                </div>

                <div
                  className="
                    mt-4
                    grid
                    gap-3
                    sm:grid-cols-2
                  "
                >
                  <PreviewControl
                    label="Mood · भाव"
                    value="सम्झना · Nostalgic"
                  />

                  <PreviewControl
                    label="Vocals · स्वर"
                    value="युगल · Male + Female"
                  />

                  <PreviewControl
                    label="Instruments · बाजा"
                    value="Madal · Sarangi · Bansuri"
                  />

                  <PreviewControl
                    label="Length · अवधि"
                    value="1:30"
                  />
                </div>

                <div
                  className="
                    folk-track-preview
                    mt-5
                    rounded-2xl
                    border
                    border-amber-300/10
                    bg-amber-300/[0.025]
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <div>
                      <p
                        className="
                          text-[11px]
                          tracking-[0.15em]
                          text-amber-300/60
                          uppercase
                        "
                      >
                        लोक धुन झलक
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          font-medium
                          text-white
                        "
                      >
                        गाउँ फर्किने बाटो
                      </p>
                    </div>

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        text-sm
                        text-black
                      "
                    >
                      ▶
                    </div>
                  </div>

                  <div
                    className="
                      mt-5
                      flex
                      h-14
                      items-center
                      gap-1
                      overflow-hidden
                    "
                  >
                    {[
                      18, 42, 74, 35, 88, 58, 28,
                      66, 94, 52, 38, 82, 48, 72,
                      31, 61, 90, 44, 68, 25, 55,
                      78, 36, 64,
                    ].map(
                      (
                        height,
                        index
                      ) => (
                        <span
                          key={index}
                          className="
                            folk-wave-bar
                            min-w-1
                            flex-1
                            rounded-full
                            bg-gradient-to-t
                            from-amber-800/70
                            to-amber-200/80
                          "
                          style={{
                            height:
                              `${height}%`,
                            animationDelay:
                              `${index * 0.055}s`,
                          }}
                        />
                      )
                    )}
                  </div>

                  <div
                    className="
                      mt-4
                      flex
                      flex-wrap
                      items-center
                      gap-2
                      text-[11px]
                      text-neutral-600
                    "
                  >
                    <span>
                      Gemma lyrics engine
                    </span>
                    <span>•</span>
                    <span>
                      ACE-Step folk audio
                    </span>
                    <span>•</span>
                    <span>
                      Nepali LoRA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          data-reveal
          className="
            folk-reveal
            border-b
            border-white/5
            bg-white/[0.012]
          "
        >
          <div
            className="
              mx-auto
              grid
              max-w-[1440px]
              gap-px
              px-5
              sm:grid-cols-2
              sm:px-8
              lg:grid-cols-4
              lg:px-10
            "
          >
            <LandingStat
              eyebrow="Lyric craft"
              title="Original Nepali lines"
              description="Draft, review and refine lyrics before you create the final song."
            />

            <LandingStat
              eyebrow="Lok dhun"
              title="Traditional timbre"
              description="Madal, Sarangi and Bansuri sit at the center of the arrangement."
            />

            <LandingStat
              eyebrow="Singing"
              title="Choose the voice form"
              description="Male, female, duet and Dohori-inspired performance styles."
            />

            <LandingStat
              eyebrow="Song diary"
              title="Keep every composition"
              description="A private archive for your tracks, lyrics, playback and downloads."
            />
          </div>
        </section>

        <section
          id="how-it-works"
          data-reveal
          className="
            folk-reveal
            mx-auto
            max-w-[1440px]
            scroll-mt-28
            px-5
            py-24
            sm:px-8
            lg:px-10
          "
        >
          <div className="max-w-2xl">
            <p
              className="
                text-xs
                tracking-[0.18em]
                text-amber-300/60
                uppercase
              "
            >
              From story seed to lok geet
            </p>

            <h2
              className="
                mt-3
                text-3xl
                font-semibold
                tracking-[-0.035em]
                text-white
                sm:text-4xl
              "
            >
              Shape a Nepali folk song in
              three guided steps.
            </h2>

            <p
              className="
                mt-4
                text-sm
                leading-7
                text-neutral-500
                sm:text-base
              "
            >
              The workflow is designed to feel
              closer to a folk composition desk
              than a generic prompt box — you keep
              control of the story, lyrics, folk
              arrangement and vocal character.
            </p>
          </div>

          <div
            className="
              mt-12
              grid
              gap-4
              lg:grid-cols-3
            "
          >
            <LandingStep
              number="01"
              title="Begin with the memory"
              description="Start from the place, relationship, memory or lived experience that your song should carry."
              detail="Story · mood · duration"
            />

            <LandingStep
              number="02"
              title="Refine the lyrics"
              description="Your fine-tuned Gemma model drafts Nepali lyrics which you can review, polish and keep culturally grounded."
              detail="Gemma-3-4B · Nepali Lyrics LoRA"
            />

            <LandingStep
              number="03"
              title="Compose the final dhun"
              description="Choose instruments and singing style, then pass the finished lyrics into ACE-Step for the complete folk arrangement."
              detail="ACE-Step 1.5 · Nepali Folk LoRA"
            />
          </div>
        </section>

        <section
          id="features"
          data-reveal
          className="
            folk-reveal
            scroll-mt-28
            border-y
            border-white/5
            bg-white/[0.012]
          "
        >
          <div
            className="
              mx-auto
              max-w-[1440px]
              px-5
              py-24
              sm:px-8
              lg:px-10
            "
          >
            <div
              className="
                grid
                gap-10
                lg:grid-cols-[0.72fr_1.28fr]
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    tracking-[0.18em]
                    text-emerald-300/60
                    uppercase
                  "
                >
                  Designed around Nepali folk forms
                </p>

                <h2
                  className="
                    mt-3
                    text-3xl
                    font-semibold
                    tracking-[-0.035em]
                    text-white
                    sm:text-4xl
                  "
                >
                  More than a generic
                  AI music template.
                </h2>

                <p
                  className="
                    mt-4
                    max-w-xl
                    text-sm
                    leading-7
                    text-neutral-500
                  "
                >
                  The interface is shaped around
                  Nepali lyrics, folk instruments,
                  vocal traditions and your own
                  model pipeline, so the experience
                  feels culturally anchored rather
                  than visually generic.
                </p>
              </div>

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                "
              >
                <LandingFeature
                  icon="◌"
                  title="Folk mood direction"
                  description="Move between nostalgic, romantic, joyful and emotional song directions."
                />

                <LandingFeature
                  icon="♫"
                  title="Traditional arrangement core"
                  description="Select Madal, Sarangi and Bansuri to guide the final musical texture."
                />

                <LandingFeature
                  icon="◎"
                  title="Singer form"
                  description="Request solo male, solo female, duet, same-gender duet, Dohori or automatic singing style."
                />

                <LandingFeature
                  icon="▤"
                  title="Personal song archive"
                  description="Every account has its own generated tracks, lyrics, downloads and saved metadata."
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="
            mx-auto
            max-w-[1440px]
            px-5
            py-24
            sm:px-8
            lg:px-10
          "
        >
          <div
            className="
              grid
              gap-6
              lg:grid-cols-2
            "
          >
            <div
              className="
                rounded-[28px]
                border
                border-white/7
                bg-white/[0.022]
                p-6
                sm:p-8
              "
            >
              <p
                className="
                  text-xs
                  tracking-[0.17em]
                  text-neutral-600
                  uppercase
                "
              >
                लोक बाजा · Folk instruments
              </p>

              <h3
                className="
                  mt-3
                  text-2xl
                  font-semibold
                  tracking-tight
                  text-white
                "
              >
                Shape the sound around familiar folk timbres.
              </h3>

              <div
                className="
                  mt-8
                  space-y-3
                "
              >
                <LandingInstrument
                  name="Madal"
                  nepali="मादल"
                  description="The pulse and rhythmic backbone for the arrangement."
                />

                <LandingInstrument
                  name="Sarangi"
                  nepali="सारङ्गी"
                  description="A lyrical bowed voice that carries memory and emotion."
                />

                <LandingInstrument
                  name="Bansuri"
                  nepali="बाँसुरी"
                  description="A light flute texture with pastoral and melodic colour."
                />
              </div>
            </div>

            <div
              className="
                rounded-[28px]
                border
                border-white/7
                bg-white/[0.022]
                p-6
                sm:p-8
              "
            >
              <p
                className="
                  text-xs
                  tracking-[0.17em]
                  text-neutral-600
                  uppercase
                "
              >
                लोक स्वर · Vocal styles
              </p>

              <h3
                className="
                  mt-3
                  text-2xl
                  font-semibold
                  tracking-tight
                  text-white
                "
              >
                Choose how the story is voiced.
              </h3>

              <div
                className="
                  mt-8
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                {[
                  ["Male", "पुरुष"],
                  ["Female", "महिला"],
                  ["Male + Female", "युगल"],
                  ["Dohori", "दोहोरी"],
                ].map(
                  ([label, nepali]) => (
                    <div
                      key={label}
                      className="
                        rounded-2xl
                        border
                        border-white/7
                        bg-black/20
                        p-4
                      "
                    >
                      <p
                        className="
                          text-sm
                          font-medium
                          text-white
                        "
                      >
                        {label}
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-neutral-600
                        "
                      >
                        {nepali}
                      </p>
                    </div>
                  )
                )}
              </div>

              <p
                className="
                  mt-5
                  text-xs
                  leading-5
                  text-neutral-600
                "
              >
                Vocal settings guide the model toward a performance style, although exact voice colour can still vary between generations.
              </p>
            </div>
          </div>
        </section>

        <section
          id="models"
          data-reveal
          className="
            folk-reveal
            scroll-mt-28
            border-y
            border-white/5
            bg-black/30
          "
        >
          <div
            className="
              mx-auto
              max-w-[1440px]
              px-5
              py-24
              sm:px-8
              lg:px-10
            "
          >
            <div className="text-center">
              <p
                className="
                  text-xs
                  tracking-[0.18em]
                  text-amber-300/60
                  uppercase
                "
              >
                Fine-tuned folk AI pipeline
              </p>

              <h2
                className="
                  mx-auto
                  mt-3
                  max-w-2xl
                  text-3xl
                  font-semibold
                  tracking-[-0.035em]
                  text-white
                  sm:text-4xl
                "
              >
                Two specialized models,
                one continuous folk studio.
              </h2>
            </div>

            <div
              className="
                mx-auto
                mt-12
                grid
                max-w-5xl
                gap-4
                md:grid-cols-[1fr_auto_1fr]
                md:items-center
              "
            >
              <ModelCard
                eyebrow="Lyrics"
                title="Gemma-3-4B"
                subtitle="Nepali Lyrics LoRA"
                description="Generates a Nepali lyric draft from your story prompt, mood, instruments and duration."
              />

              <div
                className="
                  hidden
                  items-center
                  justify-center
                  text-neutral-700
                  md:flex
                "
              >
                →
              </div>

              <ModelCard
                eyebrow="Music"
                title="ACE-Step 1.5 Turbo"
                subtitle="Nepali Folk LoRA"
                description="Transforms the reviewed lyrics and selected folk controls into the final WAV composition."
              />
            </div>
          </div>
        </section>

        <section
          className="
            mx-auto
            max-w-[1440px]
            px-5
            py-24
            sm:px-8
            lg:px-10
          "
        >
          <div
            className="
              overflow-hidden
              rounded-[32px]
              border
              border-white/7
              bg-gradient-to-br
              from-white/[0.045]
              to-white/[0.015]
              p-6
              sm:p-10
            "
          >
            <div
              className="
                grid
                items-center
                gap-10
                lg:grid-cols-[0.85fr_1.15fr]
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    tracking-[0.18em]
                    text-emerald-300/60
                    uppercase
                  "
                >
                  Your growing song archive
                </p>

                <h2
                  className="
                    mt-3
                    text-3xl
                    font-semibold
                    tracking-[-0.035em]
                    text-white
                    sm:text-4xl
                  "
                >
                  Create today. Return to
                  your songs anytime.
                </h2>

                <p
                  className="
                    mt-4
                    max-w-xl
                    text-sm
                    leading-7
                    text-neutral-500
                  "
                >
                  Every account keeps a private
                  record of the lyrics and songs it
                  creates, turning the studio into a
                  personal archive of evolving folk
                  ideas rather than one-off outputs.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthNotice("");
                    setShowAuthPanel(true);
                  }}
                  className="
                    mt-7
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/10
                    bg-white
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-black
                    transition
                    hover:bg-neutral-200
                  "
                >
                  Open your studio
                  <span>→</span>
                </button>
              </div>

              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                <LibraryPreviewTrack
                  title="गाउँको सम्झना"
                  meta="Nostalgic · Female · 1:30"
                  icon="◌"
                />

                <LibraryPreviewTrack
                  title="मायाको बाटो"
                  meta="Romantic · Duet · 2:30"
                  icon="♡"
                />

                <LibraryPreviewTrack
                  title="पहाडको बिहान"
                  meta="Joyful · Male · 1:00"
                  icon="✦"
                />

                <LibraryPreviewTrack
                  title="घर फर्किने सपना"
                  meta="Emotional · Dohori · 1:30"
                  icon="◇"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="
            border-t
            border-white/5
            bg-white/[0.012]
          "
        >
          <div
            className="
              mx-auto
              max-w-4xl
              px-5
              py-24
              text-center
              sm:px-8
            "
          >
            <p
              className="
                text-xs
                tracking-[0.18em]
                text-amber-300/60
                uppercase
              "
            >
              Nepali Folk Studio
            </p>

            <h2
              className="
                mt-4
                text-4xl
                font-semibold
                tracking-[-0.045em]
                text-white
                sm:text-5xl
              "
            >
              Your next folk song can
              start with one sentence.
            </h2>

            <p
              className="
                mx-auto
                mt-5
                max-w-2xl
                text-sm
                leading-7
                text-neutral-500
                sm:text-base
              "
            >
              Bring the story. Shape the
              lyrics. Choose the folk sound.
              Let your AI pipeline turn it
              into music.
            </p>

            <div
              className="
                mt-8
                flex
                flex-wrap
                justify-center
                gap-3
              "
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthNotice("");
                  setShowAuthPanel(true);
                }}
                className="
                  generate-button
                  rounded-full
                  px-7
                  py-3.5
                  text-sm
                  font-semibold
                "
              >
                Start creating
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthNotice("");
                  setShowAuthPanel(true);
                }}
                className="
                  rounded-full
                  border
                  border-white/8
                  bg-white/[0.025]
                  px-7
                  py-3.5
                  text-sm
                  text-neutral-300
                  transition
                  hover:bg-white/[0.05]
                  hover:text-white
                "
              >
                Sign in
              </button>
            </div>
          </div>
        </section>

        <footer
          className="
            border-t
            border-white/5
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[1440px]
              flex-col
              gap-4
              px-5
              py-7
              text-xs
              text-neutral-600
              sm:px-8
              md:flex-row
              md:items-center
              md:justify-between
              lg:px-10
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-white/7
                  bg-white/[0.025]
                  text-[11px]
                  text-amber-200
                "
              >
                धु
              </span>
              <span>
                Nepali Folk Studio
              </span>
            </div>

            <p>
              Gemma-3-4B × ACE-Step 1.5
              · Nepali folk AI research project
            </p>
          </div>
        </footer>
      </main>
    );
  }


  // ============================================================
  // AUTHENTICATED SUNO-INSPIRED STUDIO
  // ============================================================

  return (
    <main
      className="
        folk-ambient
        studio-grid
        min-h-screen
        bg-[#090909]
        text-white
      "
    >
      <style>{MOTION_CSS}</style>
      <div
        className="
          mx-auto
          grid
          min-h-screen
          max-w-[1600px]
          lg:grid-cols-[220px_minmax(0,1fr)]
        "
      >
        {/* =====================================================
            LEFT NAVIGATION
        ====================================================== */}

        <aside
          className="
            folk-sidebar
            border-b
            border-white/6
            bg-black/30
            px-4
            py-4
            lg:sticky
            lg:top-0
            lg:h-screen
            lg:border-b-0
            lg:border-r
            lg:px-3
            lg:py-5
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              lg:block
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
                px-2
              "
            >
              <div
                className="
                  folk-logo
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-amber-200/15
                  bg-amber-100/10
                  text-lg
                  font-semibold
                  text-amber-200
                "
              >
                धु
              </div>

              <div
                className="
                  min-w-0
                "
              >
                <p
                  className="
                    truncate
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Nepali Folk
                </p>
                <p
                  className="
                    text-[10px]
                    tracking-[0.15em]
                    text-neutral-600
                    uppercase
                  "
                >
                  Studio
                </p>
              </div>
            </div>

            <div
              className="
                flex
                gap-2
                lg:mt-8
                lg:flex-col
              "
            >
              <SidebarButton
                active={
                  activeView === "create"
                }
                icon="✦"
                label="Create"
                onClick={() =>
                  setActiveView("create")
                }
              />

              <SidebarButton
                active={
                  activeView === "library"
                }
                icon="♫"
                label="Library"
                badge={
                  songs.length > 0
                    ? songs.length.toString()
                    : undefined
                }
                onClick={() =>
                  setActiveView("library")
                }
              />
            </div>
          </div>

          <div
            className="
              hidden
              lg:block
            "
          >
            <div
              className="
                mt-8
                border-t
                border-white/6
                px-2
                pt-6
              "
            >
              <p
                className="
                  mb-3
                  text-[10px]
                  tracking-[0.18em]
                  text-neutral-700
                  uppercase
                "
              >
                Studio status
              </p>

              <StatusLine
                label="Backend"
                online={backendOnline}
              />

              <StatusLine
                label="GPU"
                online={gpuOnline}
                warning={!gpuOnline}
              />

              <div
                className="
                  mt-5
                  rounded-xl
                  border
                  border-white/6
                  bg-white/[0.02]
                  p-3
                "
              >
                <p
                  className="
                    text-[11px]
                    text-neutral-600
                  "
                >
                  Your library
                </p>
                <p
                  className="
                    mt-1
                    text-2xl
                    font-semibold
                    text-white
                  "
                >
                  {songs.length}
                </p>
                <p
                  className="
                    text-[11px]
                    text-neutral-600
                  "
                >
                  saved song{songs.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div
              className="
                absolute
                bottom-5
                left-3
                right-3
              "
            >
              <div
                className="
                  rounded-xl
                  border
                  border-white/6
                  bg-white/[0.025]
                  p-3
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-amber-200/10
                      text-sm
                      font-semibold
                      text-amber-100
                    "
                  >
                    {firstName
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >
                    <p
                      className="
                        truncate
                        text-xs
                        font-medium
                        text-neutral-200
                      "
                    >
                      {currentUser.name}
                    </p>
                    <p
                      className="
                        truncate
                        text-[10px]
                        text-neutral-600
                      "
                      title={currentUser.email}
                    >
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    mt-3
                    w-full
                    rounded-lg
                    border
                    border-white/6
                    px-3
                    py-2
                    text-[11px]
                    text-neutral-500
                    transition
                    hover:bg-white/[0.04]
                    hover:text-white
                  "
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>


        {/* =====================================================
            MAIN APPLICATION
        ====================================================== */}

        <div
          className="
            folk-studio-content
            min-w-0
            pb-32
          "
        >
          {/* Top bar */}

          <header
            className="
              sticky
              top-0
              z-30
              flex
              items-center
              justify-between
              gap-4
              border-b
              border-white/6
              bg-[#090909]/90
              px-5
              py-4
              backdrop-blur-xl
              sm:px-7
              lg:px-8
            "
          >
            <div
              className="
                min-w-0
              "
            >
              <p
                className="
                  text-xs
                  text-neutral-600
                "
              >
                {activeView === "create"
                  ? `Namaste, ${firstName}`
                  : "Your private collection"}
              </p>
              <h1
                className="
                  truncate
                  text-lg
                  font-semibold
                  tracking-tight
                  text-white
                "
              >
                {activeView === "create"
                  ? "Create"
                  : "Library"}
              </h1>
            </div>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <div
                className="
                  hidden
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/6
                  bg-white/[0.025]
                  px-3
                  py-2
                  text-[11px]
                  text-neutral-500
                  sm:flex
                "
              >
                <span
                  className={`
                    h-1.5
                    w-1.5
                    rounded-full
                    ${
                      gpuOnline
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                    }
                  `}
                />
                {gpuOnline
                  ? "AI service online"
                  : "GPU offline"}
              </div>

              <button
                type="button"
                onClick={startNewSong}
                className="
                  generate-button
                  rounded-full
                  px-4
                  py-2.5
                  text-xs
                  font-semibold
                "
              >
                + New song
              </button>
            </div>
          </header>


          {/* ===================================================
              CREATE VIEW
          ==================================================== */}

          {activeView === "create" && (
            <div
              className="
                mx-auto
                grid
                max-w-7xl
                gap-6
                px-5
                py-7
                sm:px-7
                lg:grid-cols-[minmax(0,1fr)_320px]
                lg:px-8
                lg:py-8
              "
            >
              <section
                className="
                  min-w-0
                "
              >
                <div
                  className="
                    mb-6
                  "
                >
                  <p
                    className="
                      text-xs
                      font-medium
                      tracking-[0.16em]
                      text-amber-300/65
                      uppercase
                    "
                  >
                    AI song creator
                  </p>
                  <h2
                    className="
                      mt-2
                      text-3xl
                      font-semibold
                      tracking-[-0.04em]
                      text-white
                      sm:text-4xl
                    "
                  >
                    Make a Nepali folk song
                  </h2>
                  <p
                    className="
                      mt-3
                      max-w-2xl
                      text-sm
                      leading-6
                      text-neutral-500
                    "
                  >
                    Begin with the memory. Then shape the mood, folk instruments, singer setup, and song length.
                  </p>
                </div>

                {/* Prompt composer */}

                <div
                  className="
                    overflow-hidden
                    rounded-[24px]
                    border
                    border-white/8
                    bg-[#111111]
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                      border-b
                      border-white/6
                      px-5
                      py-4
                    "
                  >
                    <div>
                      <p
                        className="
                          text-sm
                          font-medium
                          text-white
                        "
                      >
                        Song idea
                      </p>
                      <p
                        className="
                          mt-0.5
                          text-[11px]
                          text-neutral-600
                        "
                      >
                        Tell Gemma what your song should be about
                      </p>
                    </div>

                    <span
                      className="
                        text-[11px]
                        text-neutral-600
                      "
                    >
                      {theme.length}/300
                    </span>
                  </div>

                  <textarea
                    id="song-theme"
                    value={theme}
                    maxLength={300}
                    disabled={isBusy}
                    onChange={(event) =>
                      setTheme(
                        event.target.value
                      )
                    }
                    placeholder="A young man returns to his mountain village after years abroad and remembers his childhood..."
                    className="
                      min-h-40
                      w-full
                      resize-none
                      bg-transparent
                      px-5
                      py-5
                      text-base
                      leading-7
                      text-white
                      outline-none
                      placeholder:text-neutral-700
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />

                  <div
                    className="
                      border-t
                      border-white/6
                      px-5
                      py-4
                    "
                  >
                    <div
                      className="
                        flex
                        flex-wrap
                        gap-2
                      "
                    >
                      {moods.map(
                        (item) => (
                          <button
                            key={item.id}
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              setMood(item.id)
                            }
                            className={`
                              rounded-full
                              border
                              px-3
                              py-2
                              text-xs
                              transition
                              disabled:opacity-50
                              ${
                                mood === item.id
                                  ? "border-amber-300/25 bg-amber-300/[0.08] text-amber-100"
                                  : "border-white/7 bg-white/[0.025] text-neutral-500 hover:text-neutral-200"
                              }
                            `}
                          >
                            {item.icon}{" "}
                            {item.english}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact style controls */}

                <div
                  className="
                    mt-4
                    grid
                    gap-3
                    sm:grid-cols-2
                  "
                >
                  <ControlPanel
                    title="Traditional instruments"
                    subtitle="Choose one or more"
                  >
                    <div
                      className="
                        flex
                        flex-wrap
                        gap-2
                      "
                    >
                      {instrumentOptions.map(
                        (instrument) => {
                          const selected =
                            instruments.includes(
                              instrument.id
                            );

                          return (
                            <button
                              key={instrument.id}
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                toggleInstrument(
                                  instrument.id
                                )
                              }
                              className={`
                                rounded-full
                                border
                                px-3
                                py-2
                                text-xs
                                transition
                                disabled:opacity-50
                                ${
                                  selected
                                    ? "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100"
                                    : "border-white/7 bg-white/[0.02] text-neutral-500"
                                }
                              `}
                            >
                              {selected ? "✓ " : "+ "}
                              {instrument.label}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </ControlPanel>

                  <ControlPanel
                    title="Song length"
                    subtitle="Target duration"
                  >
                    <div
                      className="
                        flex
                        gap-2
                      "
                    >
                      {durations.map(
                        (item) => (
                          <button
                            key={item.seconds}
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              setDuration(
                                item.seconds
                              )
                            }
                            className={`
                              flex-1
                              rounded-xl
                              border
                              px-3
                              py-2.5
                              text-xs
                              transition
                              disabled:opacity-50
                              ${
                                duration ===
                                item.seconds
                                  ? "border-amber-300/25 bg-amber-300/[0.07] text-amber-100"
                                  : "border-white/7 bg-white/[0.02] text-neutral-500"
                              }
                            `}
                          >
                            {item.label}
                          </button>
                        )
                      )}
                    </div>
                  </ControlPanel>
                </div>

                <ControlPanel
                  title="Vocal style"
                  subtitle="ACE-Step vocal conditioning"
                  className="mt-3"
                >
                  <div
                    className="
                      flex
                      gap-2
                      overflow-x-auto
                      pb-1
                    "
                  >
                    {vocalOptions.map(
                      (item) => (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            setVocalStyle(
                              item.id
                            )
                          }
                          title={
                            item.description
                          }
                          className={`
                            shrink-0
                            rounded-full
                            border
                            px-3
                            py-2
                            text-xs
                            transition
                            disabled:opacity-50
                            ${
                              vocalStyle ===
                              item.id
                                ? "border-amber-300/25 bg-amber-300/[0.08] text-amber-100"
                                : "border-white/7 bg-white/[0.02] text-neutral-500 hover:text-neutral-200"
                            }
                          `}
                        >
                          {item.label}
                        </button>
                      )
                    )}
                  </div>
                </ControlPanel>

                {/* Generate lyrics CTA */}

                <div
                  className="
                    mt-5
                    flex
                    flex-col
                    gap-3
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div
                    className="
                      min-h-5
                      text-xs
                      text-neutral-500
                    "
                  >
                    {notice ||
                      "Gemma writes the lyrics first. You can edit them before music generation."}
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleGenerateLyrics
                    }
                    disabled={isBusy}
                    className="
                      generate-button
                      flex
                      shrink-0
                      items-center
                      justify-center
                      gap-2
                      rounded-full
                      px-6
                      py-3
                      text-sm
                      font-semibold
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <span
                      className={
                        isGeneratingLyrics
                          ? "animate-spin"
                          : ""
                      }
                    >
                      {isGeneratingLyrics
                        ? "◌"
                        : "✦"}
                    </span>
                    {isGeneratingLyrics
                      ? "Writing lyrics..."
                      : "Generate lyrics"}
                  </button>
                </div>

                {/* Lyrics editor */}

                {generatedLyrics && (
                  <div
                    className="
                      mt-7
                      overflow-hidden
                      rounded-[24px]
                      border
                      border-white/8
                      bg-[#111111]
                    "
                  >
                    <div
                      className="
                        flex
                        flex-wrap
                        items-center
                        justify-between
                        gap-3
                        border-b
                        border-white/6
                        px-5
                        py-4
                      "
                    >
                      <div>
                        <p
                          className="
                            text-sm
                            font-medium
                            text-white
                          "
                        >
                          Lyrics
                        </p>
                        <p
                          className="
                            mt-0.5
                            text-[11px]
                            text-neutral-600
                          "
                        >
                          नेपाली गीतका शब्द • edit anything before generation
                        </p>
                      </div>

                      <span
                        className="
                          rounded-full
                          border
                          border-emerald-300/10
                          bg-emerald-300/[0.05]
                          px-3
                          py-1.5
                          text-[11px]
                          text-emerald-300
                        "
                      >
                        Ready for music
                      </span>
                    </div>

                    <textarea
                      value={
                        generatedLyrics
                      }
                      disabled={
                        isGeneratingMusic
                      }
                      onChange={(event) => {
                        setGeneratedLyrics(
                          event.target.value
                        );

                        if (audioUrl) {
                          URL.revokeObjectURL(
                            audioUrl
                          );
                          setAudioUrl("");
                        }

                        if (
                          playerTarget?.kind ===
                          "generated"
                        ) {
                          setPlayerTarget(null);
                        }
                      }}
                      className="
                        min-h-[26rem]
                        w-full
                        resize-y
                        bg-transparent
                        px-5
                        py-5
                        text-sm
                        leading-8
                        text-neutral-200
                        outline-none
                        disabled:opacity-60
                      "
                    />

                    <div
                      className="
                        flex
                        flex-col
                        gap-3
                        border-t
                        border-white/6
                        px-5
                        py-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >
                      <div
                        className="
                          flex
                          flex-wrap
                          gap-2
                          text-[11px]
                          text-neutral-600
                        "
                      >
                        <span>
                          {moodLabel(mood)}
                        </span>
                        <span>•</span>
                        <span>
                          {vocalLabel(
                            vocalStyle
                          )}
                        </span>
                        <span>•</span>
                        <span>
                          {formatDuration(
                            duration
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={
                          handleGenerateMusic
                        }
                        disabled={isBusy}
                        className="
                          generate-button
                          flex
                          items-center
                          justify-center
                          gap-2
                          rounded-full
                          px-6
                          py-3
                          text-sm
                          font-semibold
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        <span
                          className={
                            isGeneratingMusic
                              ? "animate-spin"
                              : ""
                          }
                        >
                          {isGeneratingMusic
                            ? "◌"
                            : "♫"}
                        </span>
                        {isGeneratingMusic
                          ? "Creating song..."
                          : "Create full song"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Freshly generated track */}

                {audioUrl && (
                  <div
                    className="
                      mt-6
                      rounded-[22px]
                      border
                      border-emerald-300/10
                      bg-emerald-300/[0.025]
                      p-4
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-4
                      "
                    >
                      <AlbumTile
                        label="NEW"
                        moodId={mood}
                        size="lg"
                      />

                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >
                        <p
                          className="
                            truncate
                            text-sm
                            font-semibold
                            text-white
                          "
                        >
                          {theme.trim() ||
                            "Studio preview"}
                        </p>
                        <p
                          className="
                            mt-1
                            truncate
                            text-xs
                            text-neutral-500
                          "
                        >
                          {moodLabel(mood)} • {vocalLabel(vocalStyle)} • {formatDuration(duration)}
                        </p>
                        <p
                          className="
                            mt-2
                            text-[11px]
                            text-emerald-300/70
                          "
                        >
                          Saved to your Library
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPlayerTarget({
                            kind: "generated",
                          })
                        }
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-white
                          text-sm
                          text-black
                          transition
                          hover:scale-105
                        "
                        aria-label="Play generated song"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                )}
              </section>


              {/* Right rail */}

              <aside
                className="
                  min-w-0
                  space-y-4
                "
              >
                <div
                  className="
                    rounded-[22px]
                    border
                    border-white/7
                    bg-[#101010]
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <div>
                      <p
                        className="
                          text-sm
                          font-medium
                          text-white
                        "
                      >
                        Recent creations
                      </p>
                      <p
                        className="
                          mt-1
                          text-[11px]
                          text-neutral-600
                        "
                      >
                        Continue where you left off
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveView(
                          "library"
                        )
                      }
                      className="
                        text-[11px]
                        text-amber-200/70
                        hover:text-amber-100
                      "
                    >
                      View all
                    </button>
                  </div>

                  <div
                    className="
                      mt-4
                      space-y-2
                    "
                  >
                    {isLoadingSongs ? (
                      <p
                        className="
                          py-6
                          text-center
                          text-xs
                          text-neutral-600
                        "
                      >
                        Loading library...
                      </p>
                    ) : recentSongs.length === 0 ? (
                      <div
                        className="
                          rounded-xl
                          border
                          border-dashed
                          border-white/7
                          px-4
                          py-7
                          text-center
                        "
                      >
                        <p
                          className="
                            text-xs
                            text-neutral-500
                          "
                        >
                          Your generated songs will appear here.
                        </p>
                      </div>
                    ) : (
                      recentSongs.map(
                        (song) => (
                          <MiniTrack
                            key={song.id}
                            song={song}
                            busy={
                              songActionId ===
                              song.id
                            }
                            onPlay={() =>
                              loadSavedSongAudio(
                                song
                              )
                            }
                            onUse={() =>
                              useSongInStudio(
                                song
                              )
                            }
                          />
                        )
                      )
                    )}
                  </div>
                </div>

                <div
                  className="
                    rounded-[22px]
                    border
                    border-white/7
                    bg-[#101010]
                    p-4
                  "
                >
                  <p
                    className="
                      text-sm
                      font-medium
                      text-white
                    "
                  >
                    Generation stack
                  </p>

                  <div
                    className="
                      mt-4
                      space-y-3
                    "
                  >
                    <ModelLine
                      label="Lyrics"
                      model="Gemma-3-4B + LoRA"
                      online={gpuOnline}
                    />
                    <ModelLine
                      label="Music"
                      model="ACE-Step 1.5 + LoRA"
                      online={gpuOnline}
                    />
                  </div>
                </div>

                <div
                  className="
                    rounded-[22px]
                    border
                    border-white/7
                    bg-[#101010]
                    p-4
                  "
                >
                  <p
                    className="
                      text-[10px]
                      tracking-[0.16em]
                      text-neutral-700
                      uppercase
                    "
                  >
                    Current recipe
                  </p>

                  <div
                    className="
                      mt-4
                      space-y-3
                      text-xs
                    "
                  >
                    <RecipeLine
                      label="Mood · भाव"
                      value={
                        moodLabel(mood)
                      }
                    />
                    <RecipeLine
                      label="Vocals · स्वर"
                      value={
                        vocalLabel(
                          vocalStyle
                        )
                      }
                    />
                    <RecipeLine
                      label="Length · अवधि"
                      value={
                        formatDuration(
                          duration
                        )
                      }
                    />
                    <RecipeLine
                      label="Instruments · बाजा"
                      value={
                        instruments.length
                          ? instruments.join(
                              ", "
                            )
                          : "None"
                      }
                    />
                  </div>
                </div>
              </aside>
            </div>
          )}


          {/* ===================================================
              LIBRARY VIEW
          ==================================================== */}

          {activeView === "library" && (
            <section
              className="
                mx-auto
                max-w-7xl
                px-5
                py-7
                sm:px-7
                lg:px-8
                lg:py-8
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-5
                  lg:flex-row
                  lg:items-end
                  lg:justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-medium
                      tracking-[0.16em]
                      text-amber-300/65
                      uppercase
                    "
                  >
                    My songs
                  </p>
                  <h2
                    className="
                      mt-2
                      text-3xl
                      font-semibold
                      tracking-[-0.04em]
                      text-white
                      sm:text-4xl
                    "
                  >
                    Your Library
                  </h2>
                  <p
                    className="
                      mt-3
                      text-sm
                      text-neutral-500
                    "
                  >
                    {songs.length} saved generation{songs.length === 1 ? "" : "s"} • private to your account
                  </p>
                </div>

                <div
                  className="
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                  "
                >
                  <input
                    value={songSearch}
                    onChange={(event) =>
                      setSongSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search songs..."
                    className="
                      min-w-0
                      rounded-full
                      border
                      border-white/7
                      bg-white/[0.025]
                      px-4
                      py-2.5
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-neutral-600
                      focus:border-amber-300/20
                      sm:w-64
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fetchMySongs()
                    }
                    disabled={isLoadingSongs}
                    className="
                      rounded-full
                      border
                      border-white/7
                      bg-white/[0.025]
                      px-4
                      py-2.5
                      text-xs
                      text-neutral-300
                      transition
                      hover:bg-white/[0.05]
                      disabled:opacity-50
                    "
                  >
                    {isLoadingSongs
                      ? "Refreshing..."
                      : "↻ Refresh"}
                  </button>
                </div>
              </div>

              <div
                className="
                  mt-6
                  flex
                  gap-2
                  overflow-x-auto
                  pb-2
                "
              >
                <FilterChip
                  active={
                    songMoodFilter ===
                    "all"
                  }
                  label="All"
                  onClick={() =>
                    setSongMoodFilter(
                      "all"
                    )
                  }
                />

                {moods.map(
                  (item) => (
                    <FilterChip
                      key={item.id}
                      active={
                        songMoodFilter ===
                        item.id
                      }
                      label={
                        item.english
                      }
                      onClick={() =>
                        setSongMoodFilter(
                          item.id
                        )
                      }
                    />
                  )
                )}
              </div>

              <div
                className="
                  mt-5
                  overflow-hidden
                  rounded-[22px]
                  border
                  border-white/7
                  bg-[#101010]
                "
              >
                <div
                  className="
                    hidden
                    grid-cols-[minmax(0,1fr)_130px_90px_160px]
                    gap-4
                    border-b
                    border-white/6
                    px-5
                    py-3
                    text-[10px]
                    tracking-[0.14em]
                    text-neutral-700
                    uppercase
                    md:grid
                  "
                >
                  <span>Track</span>
                  <span>Style</span>
                  <span>Length</span>
                  <span className="text-right">
                    Actions
                  </span>
                </div>

                {isLoadingSongs ? (
                  <div
                    className="
                      px-5
                      py-16
                      text-center
                      text-sm
                      text-neutral-600
                    "
                  >
                    Loading your library...
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div
                    className="
                      px-5
                      py-16
                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-white/7
                        bg-white/[0.025]
                        text-xl
                        text-neutral-500
                      "
                    >
                      ♫
                    </div>
                    <p
                      className="
                        mt-4
                        text-sm
                        font-medium
                        text-neutral-300
                      "
                    >
                      {songs.length === 0
                        ? "No songs yet"
                        : "No matching songs"}
                    </p>
                    <p
                      className="
                        mt-1
                        text-xs
                        text-neutral-600
                      "
                    >
                      {songs.length === 0
                        ? "Create your first Nepali folk song to start your library."
                        : "Try a different search or mood filter."}
                    </p>

                    {songs.length === 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveView(
                            "create"
                          )
                        }
                        className="
                          generate-button
                          mt-5
                          rounded-full
                          px-5
                          py-2.5
                          text-xs
                          font-semibold
                        "
                      >
                        Create a song
                      </button>
                    )}
                  </div>
                ) : (
                  filteredSongs.map(
                    (song) => {
                      const busy =
                        songActionId ===
                        song.id;

                      const loaded =
                        Boolean(
                          songAudioUrls[
                            song.id
                          ]
                        );

                      const playing =
                        playerTarget?.kind ===
                          "saved" &&
                        playerTarget.songId ===
                          song.id;

                      return (
                        <article
                          key={song.id}
                          className={`
                            border-b
                            border-white/5
                            px-4
                            py-4
                            transition
                            last:border-b-0
                            hover:bg-white/[0.025]
                            ${
                              playing
                                ? "bg-amber-300/[0.035]"
                                : ""
                            }
                          `}
                        >
                          <div
                            className="
                              grid
                              min-w-0
                              gap-4
                              md:grid-cols-[minmax(0,1fr)_130px_90px_160px]
                              md:items-center
                            "
                          >
                            <div
                              className="
                                flex
                                min-w-0
                                items-center
                                gap-3
                              "
                            >
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  loadSavedSongAudio(
                                    song
                                  )
                                }
                                className="
                                  relative
                                  shrink-0
                                  disabled:opacity-50
                                "
                                aria-label={`Play ${songTitle(song)}`}
                              >
                                <AlbumTile
                                  label={
                                    loaded
                                      ? "▶"
                                      : "♫"
                                  }
                                  moodId={
                                    song.mood
                                  }
                                />
                              </button>

                              <div
                                className="
                                  min-w-0
                                "
                              >
                                <p
                                  className="
                                    truncate
                                    text-sm
                                    font-medium
                                    text-white
                                  "
                                  title={
                                    song.theme ??
                                    undefined
                                  }
                                >
                                  {songTitle(song)}
                                </p>
                                <p
                                  className="
                                    mt-1
                                    truncate
                                    text-xs
                                    text-neutral-600
                                  "
                                >
                                  {song.instruments.join(
                                    " • "
                                  )}
                                </p>
                                <p
                                  className="
                                    mt-1
                                    text-[10px]
                                    text-neutral-700
                                  "
                                >
                                  {formatDate(
                                    song.created_at
                                  )}
                                </p>
                              </div>
                            </div>

                            <div
                              className="
                                text-xs
                                text-neutral-500
                              "
                            >
                              <p>
                                {moodLabel(
                                  song.mood
                                )}
                              </p>
                              <p
                                className="
                                  mt-1
                                  text-[11px]
                                  text-neutral-700
                                "
                              >
                                {vocalLabel(
                                  song.vocal_style
                                )}
                              </p>
                            </div>

                            <p
                              className="
                                text-xs
                                text-neutral-500
                              "
                            >
                              {formatDuration(
                                song.duration
                              )}
                            </p>

                            <div
                              className="
                                flex
                                flex-wrap
                                gap-2
                                md:justify-end
                              "
                            >
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  loadSavedSongAudio(
                                    song
                                  )
                                }
                                className="
                                  rounded-full
                                  bg-white
                                  px-3
                                  py-2
                                  text-[11px]
                                  font-medium
                                  text-black
                                  disabled:opacity-50
                                "
                              >
                                {busy
                                  ? "..."
                                  : "▶ Play"}
                              </button>

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  useSongInStudio(
                                    song
                                  )
                                }
                                className="
                                  rounded-full
                                  border
                                  border-white/7
                                  px-3
                                  py-2
                                  text-[11px]
                                  text-neutral-400
                                  hover:text-white
                                  disabled:opacity-50
                                "
                              >
                                Use
                              </button>

                              <details
                                className="
                                  relative
                                "
                              >
                                <summary
                                  className="
                                    flex
                                    h-8
                                    w-8
                                    cursor-pointer
                                    list-none
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    border-white/7
                                    text-sm
                                    text-neutral-500
                                    hover:text-white
                                  "
                                >
                                  •••
                                </summary>

                                <div
                                  className="
                                    absolute
                                    right-0
                                    z-20
                                    mt-2
                                    w-44
                                    rounded-xl
                                    border
                                    border-white/8
                                    bg-[#181818]
                                    p-1.5
                                    shadow-2xl
                                  "
                                >
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                      downloadSavedSong(
                                        song
                                      )
                                    }
                                    className="
                                      w-full
                                      rounded-lg
                                      px-3
                                      py-2
                                      text-left
                                      text-xs
                                      text-neutral-300
                                      hover:bg-white/[0.05]
                                    "
                                  >
                                    ↓ Download WAV
                                  </button>

                                  <details
                                    className="
                                      mt-1
                                      rounded-lg
                                      px-3
                                      py-2
                                      text-xs
                                      text-neutral-400
                                      hover:bg-white/[0.05]
                                    "
                                  >
                                    <summary
                                      className="
                                        cursor-pointer
                                        list-none
                                      "
                                    >
                                      View lyrics
                                    </summary>
                                    <pre
                                      className="
                                        mt-3
                                        max-h-56
                                        overflow-y-auto
                                        whitespace-pre-wrap
                                        font-sans
                                        text-[11px]
                                        leading-5
                                        text-neutral-500
                                      "
                                    >
                                      {song.lyrics}
                                    </pre>
                                  </details>

                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                      deleteSavedSong(
                                        song
                                      )
                                    }
                                    className="
                                      mt-1
                                      w-full
                                      rounded-lg
                                      px-3
                                      py-2
                                      text-left
                                      text-xs
                                      text-red-300/70
                                      hover:bg-red-300/[0.05]
                                    "
                                  >
                                    Delete
                                  </button>
                                </div>
                              </details>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )
                )}
              </div>
            </section>
          )}
        </div>
      </div>


      {/* =====================================================
          PERSISTENT MUSIC PLAYER
      ====================================================== */}

      {playerTarget && playerSrc && (
        <div
          className="
            folk-player
            fixed
            bottom-0
            left-0
            right-0
            z-50
            border-t
            border-white/8
            bg-[#111111]/95
            backdrop-blur-xl
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[1600px]
              flex-col
              gap-3
              px-4
              py-3
              sm:flex-row
              sm:items-center
              lg:pl-[236px]
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center
                gap-3
                sm:w-[260px]
              "
            >
              <AlbumTile
                label="♫"
                moodId={
                  playerTarget.kind ===
                  "saved"
                    ? playerSong?.mood ??
                      "nostalgic"
                    : mood
                }
                size="sm"
              />

              <div
                className="
                  min-w-0
                "
              >
                <p
                  className="
                    truncate
                    text-xs
                    font-medium
                    text-white
                  "
                >
                  {playerTitle}
                </p>
                <p
                  className="
                    mt-1
                    truncate
                    text-[10px]
                    text-neutral-600
                  "
                >
                  {playerMeta}
                </p>
              </div>
            </div>

            <audio
              key={playerSrc}
              controls
              autoPlay
              preload="metadata"
              src={playerSrc}
              className="
                min-w-0
                flex-1
              "
            />

            <button
              type="button"
              onClick={() =>
                setPlayerTarget(null)
              }
              className="
                hidden
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                border
                border-white/7
                text-xs
                text-neutral-500
                hover:text-white
                sm:flex
              "
              aria-label="Close player"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}



function PreviewControl({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-white/7
        bg-white/[0.022]
        px-4
        py-3
      "
    >
      <p
        className="
          text-[10px]
          tracking-[0.13em]
          text-neutral-600
          uppercase
        "
      >
        {label}
      </p>
      <p
        className="
          mt-1.5
          text-xs
          font-medium
          text-neutral-200
        "
      >
        {value}
      </p>
    </div>
  );
}


function LandingStat({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        border-white/5
        py-7
        sm:px-6
        sm:first:pl-0
        lg:border-l
        lg:first:border-l-0
      "
    >
      <p
        className="
          text-[10px]
          tracking-[0.16em]
          text-neutral-600
          uppercase
        "
      >
        {eyebrow}
      </p>
      <p
        className="
          mt-2
          text-sm
          font-medium
          text-white
        "
      >
        {title}
      </p>
      <p
        className="
          mt-2
          max-w-xs
          text-xs
          leading-5
          text-neutral-600
        "
      >
        {description}
      </p>
    </div>
  );
}


function LandingStep({
  number,
  title,
  description,
  detail,
}: {
  number: string;
  title: string;
  description: string;
  detail: string;
}) {
  return (
    <article
      className="
        rounded-[26px]
        border
        border-white/7
        bg-white/[0.022]
        p-6
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-amber-300/10
          bg-amber-300/[0.04]
          text-xs
          text-amber-200
        "
      >
        {number}
      </div>
      <h3
        className="
          mt-6
          text-xl
          font-semibold
          tracking-tight
          text-white
        "
      >
        {title}
      </h3>
      <p
        className="
          mt-3
          text-sm
          leading-6
          text-neutral-500
        "
      >
        {description}
      </p>
      <p
        className="
          mt-6
          border-t
          border-white/6
          pt-4
          text-[11px]
          text-neutral-600
        "
      >
        {detail}
      </p>
    </article>
  );
}


function LandingFeature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <article
      className="
        rounded-2xl
        border
        border-white/7
        bg-black/20
        p-5
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-xl
          border
          border-white/7
          bg-white/[0.03]
          text-sm
          text-amber-200
        "
      >
        {icon}
      </div>
      <h3
        className="
          mt-5
          text-sm
          font-medium
          text-white
        "
      >
        {title}
      </h3>
      <p
        className="
          mt-2
          text-xs
          leading-5
          text-neutral-600
        "
      >
        {description}
      </p>
    </article>
  );
}


function LandingInstrument({
  name,
  nepali,
  description,
}: {
  name: string;
  nepali: string;
  description: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-4
        rounded-2xl
        border
        border-white/7
        bg-black/20
        p-4
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          border
          border-amber-300/10
          bg-amber-300/[0.04]
          text-sm
          text-amber-200
        "
      >
        ♫
      </div>
      <div className="min-w-0">
        <div
          className="
            flex
            flex-wrap
            items-center
            gap-2
          "
        >
          <p
            className="
              text-sm
              font-medium
              text-white
            "
          >
            {name}
          </p>
          <span
            className="
              text-xs
              text-neutral-600
            "
          >
            {nepali}
          </span>
        </div>
        <p
          className="
            mt-1
            text-xs
            leading-5
            text-neutral-600
          "
        >
          {description}
        </p>
      </div>
    </div>
  );
}


function ModelCard({
  eyebrow,
  title,
  subtitle,
  description,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <article
      className="
        rounded-[26px]
        border
        border-white/7
        bg-white/[0.022]
        p-6
      "
    >
      <p
        className="
          text-[10px]
          tracking-[0.16em]
          text-neutral-600
          uppercase
        "
      >
        {eyebrow}
      </p>
      <h3
        className="
          mt-4
          text-2xl
          font-semibold
          tracking-tight
          text-white
        "
      >
        {title}
      </h3>
      <p
        className="
          mt-1
          text-sm
          text-amber-200/70
        "
      >
        {subtitle}
      </p>
      <p
        className="
          mt-5
          text-sm
          leading-6
          text-neutral-500
        "
      >
        {description}
      </p>
    </article>
  );
}


function LibraryPreviewTrack({
  title,
  meta,
  icon,
}: {
  title: string;
  meta: string;
  icon: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-2xl
        border
        border-white/7
        bg-black/20
        p-3
      "
    >
      <div
        className="
          flex
          h-12
          w-12
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-gradient-to-br
          from-amber-300/15
          to-emerald-400/5
          text-amber-200
        "
      >
        {icon}
      </div>
      <div
        className="
          min-w-0
          flex-1
        "
      >
        <p
          className="
            truncate
            text-sm
            font-medium
            text-white
          "
        >
          {title}
        </p>
        <p
          className="
            mt-1
            truncate
            text-[11px]
            text-neutral-600
          "
        >
          {meta}
        </p>
      </div>
      <div
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          border-white/7
          bg-white/[0.03]
          text-[10px]
          text-neutral-400
        "
      >
        ▶
      </div>
    </div>
  );
}


function SidebarButton({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        min-w-0
        items-center
        gap-3
        rounded-xl
        px-3
        py-2.5
        text-sm
        transition
        lg:w-full
        ${
          active
            ? "bg-white/[0.07] text-white"
            : "text-neutral-500 hover:bg-white/[0.035] hover:text-neutral-200"
        }
      `}
    >
      <span
        className="
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          text-sm
        "
      >
        {icon}
      </span>
      <span
        className="
          hidden
          min-w-0
          flex-1
          text-left
          lg:block
        "
      >
        {label}
      </span>
      {badge && (
        <span
          className="
            hidden
            rounded-full
            bg-white/[0.06]
            px-2
            py-0.5
            text-[10px]
            text-neutral-500
            lg:inline
          "
        >
          {badge}
        </span>
      )}
    </button>
  );
}


function StatusLine({
  label,
  online,
  warning = false,
}: {
  label: string;
  online: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        py-2
        text-xs
      "
    >
      <span
        className="
          text-neutral-600
        "
      >
        {label}
      </span>
      <span
        className="
          flex
          items-center
          gap-2
          text-neutral-400
        "
      >
        <span
          className={`
            h-1.5
            w-1.5
            rounded-full
            ${
              online
                ? "bg-emerald-400"
                : warning
                  ? "bg-amber-400"
                  : "bg-red-400"
            }
          `}
        />
        {online
          ? "Online"
          : "Offline"}
      </span>
    </div>
  );
}


function ControlPanel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        rounded-[18px]
        border
        border-white/7
        bg-[#101010]
        p-4
        ${className}
      `}
    >
      <div
        className="
          mb-3
        "
      >
        <p
          className="
            text-xs
            font-medium
            text-neutral-300
          "
        >
          {title}
        </p>
        <p
          className="
            mt-0.5
            text-[10px]
            text-neutral-700
          "
        >
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}


function AlbumTile({
  label,
  moodId,
  size = "md",
}: {
  label: string;
  moodId: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions =
    size === "sm"
      ? "h-10 w-10 rounded-lg"
      : size === "lg"
        ? "h-16 w-16 rounded-xl"
        : "h-12 w-12 rounded-xl";

  const accent =
    moodId === "romantic"
      ? "from-rose-950/80 via-amber-950/70 to-neutral-900"
      : moodId === "joyful"
        ? "from-amber-900/80 via-orange-950/70 to-neutral-900"
        : moodId === "emotional"
          ? "from-indigo-950/80 via-neutral-900 to-emerald-950/50"
          : "from-emerald-950/80 via-neutral-900 to-amber-950/50";

  return (
    <div
      className={`
        ${dimensions}
        flex
        shrink-0
        items-center
        justify-center
        border
        border-white/10
        bg-gradient-to-br
        ${accent}
        text-xs
        font-semibold
        tracking-wide
        text-white/80
      `}
    >
      {label}
    </div>
  );
}


function MiniTrack({
  song,
  busy,
  onPlay,
  onUse,
}: {
  song: SongRecord;
  busy: boolean;
  onPlay: () => void;
  onUse: () => void;
}) {
  return (
    <div
      className="
        group
        flex
        min-w-0
        items-center
        gap-3
        rounded-xl
        p-2
        transition
        hover:bg-white/[0.035]
      "
    >
      <button
        type="button"
        disabled={busy}
        onClick={onPlay}
        className="
          shrink-0
          disabled:opacity-50
        "
        aria-label={`Play ${songTitle(song)}`}
      >
        <AlbumTile
          label={busy ? "…" : "▶"}
          moodId={song.mood}
          size="sm"
        />
      </button>

      <div
        className="
          min-w-0
          flex-1
        "
      >
        <p
          className="
            truncate
            text-xs
            font-medium
            text-neutral-200
          "
        >
          {songTitle(song)}
        </p>
        <p
          className="
            mt-1
            truncate
            text-[10px]
            text-neutral-700
          "
        >
          {moodLabel(song.mood)} • {formatDuration(song.duration)}
        </p>
      </div>

      <button
        type="button"
        onClick={onUse}
        className="
          rounded-full
          border
          border-white/7
          px-2.5
          py-1.5
          text-[10px]
          text-neutral-600
          opacity-100
          transition
          hover:text-white
          lg:opacity-0
          lg:group-hover:opacity-100
        "
      >
        Use
      </button>
    </div>
  );
}


function ModelLine({
  label,
  model,
  online,
}: {
  label: string;
  model: string;
  online: boolean;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-xl
        border
        border-white/6
        bg-black/20
        p-3
      "
    >
      <span
        className={`
          h-2
          w-2
          shrink-0
          rounded-full
          ${
            online
              ? "bg-emerald-400"
              : "bg-amber-400"
          }
        `}
      />
      <div
        className="
          min-w-0
        "
      >
        <p
          className="
            text-[10px]
            text-neutral-700
          "
        >
          {label}
        </p>
        <p
          className="
            truncate
            text-xs
            text-neutral-300
          "
        >
          {model}
        </p>
      </div>
    </div>
  );
}


function RecipeLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
      "
    >
      <span
        className="
          text-neutral-700
        "
      >
        {label}
      </span>
      <span
        className="
          max-w-[60%]
          text-right
          text-neutral-400
        "
      >
        {value}
      </span>
    </div>
  );
}


function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        shrink-0
        rounded-full
        border
        px-4
        py-2
        text-xs
        transition
        ${
          active
            ? "border-white/15 bg-white text-black"
            : "border-white/7 bg-white/[0.025] text-neutral-500 hover:text-neutral-200"
        }
      `}
    >
      {label}
    </button>
  );
}
