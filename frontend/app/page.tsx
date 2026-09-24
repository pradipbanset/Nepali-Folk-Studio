"use client";

import {
  useEffect,
  useState,
} from "react";


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
];


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
];


const durations = [
  {
    seconds: 60,
    label: "1 min",
  },
  {
    seconds: 90,
    label: "1.5 min",
  },
  {
    seconds: 150,
    label: "2.5 min",
  },
];


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


export default function Home() {
  const [
    health,
    setHealth,
  ] = useState<HealthResponse | null>(
    null
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
  ] = useState(
    90
  );

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


  // ============================================================
  // BACKEND HEALTH CHECK
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

        setHealth(
          data
        );

      } catch {
        setHealth(
          null
        );
      }
    }


    checkHealth();


    const interval =
      setInterval(
        checkHealth,
        10000
      );


    return () => {
      clearInterval(
        interval
      );
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
            "Your session has expired. Please sign in again."
          );
        }

        const user: AuthUser =
          await response.json();

        setAccessToken(
          storedToken
        );

        setCurrentUser(
          user
        );

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
  // AUTH HELPERS
  // ============================================================

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
          email:
            email.trim(),
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

    setAccessToken(
      token
    );

    setCurrentUser(
      meData
    );

    setAuthPassword("");
    setAuthNotice("");

    await fetchMySongs(
      token
    );
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

    if (
      authPassword.length < 8
    ) {
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
            name:
              authName.trim(),
            email:
              authEmail.trim(),
            password:
              authPassword,
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
      URL.revokeObjectURL(
        url
      );
    });

    setAccessToken("");
    setCurrentUser(null);
    setSongs([]);
    setSongAudioUrls({});
    setAudioUrl("");
    setGeneratedLyrics("");
    setNotice("");
    setAuthPassword("");
  }


  function handleUnauthorized() {
    handleLogout();

    setAuthNotice(
      "Your session expired. Please sign in again."
    );
  }


  // ============================================================
  // MY SONGS
  // ============================================================

  async function fetchMySongs(
    tokenOverride?: string,
  ) {
    const token =
      tokenOverride ??
      accessToken;

    if (!token) {
      return;
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
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to load your songs."
        );
      }

      setSongs(
        data
      );

    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to load your songs."
      );

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

    if (
      songAudioUrls[
        song.id
      ]
    ) {
      return;
    }

    setSongActionId(
      song.id
    );

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
        URL.createObjectURL(
          blob
        );

      setSongAudioUrls(
        (current) => ({
          ...current,
          [song.id]: url,
        })
      );

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

    setSongActionId(
      song.id
    );

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
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;
      link.download =
        `nepali-folk-${song.id}.wav`;

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();

      URL.revokeObjectURL(
        url
      );

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

    setSongActionId(
      song.id
    );

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
          // Keep fallback message.
        }

        throw new Error(
          message
        );
      }

      const existingUrl =
        songAudioUrls[
          song.id
        ];

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

          delete next[
            song.id
          ];

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
  // CLEAN UP GENERATED AUDIO OBJECT URL
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
  // INSTRUMENT TOGGLE
  // ============================================================

  function toggleInstrument(
    instrument: string
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


    if (
      instruments.length === 0
    ) {
      setNotice(
        "Select at least one traditional instrument."
      );

      return;
    }


    setIsGeneratingLyrics(
      true
    );

    setGeneratedLyrics(
      ""
    );


    // If the user creates new lyrics,
    // remove the previous song because it
    // belongs to the old lyrics.
    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );

      setAudioUrl(
        ""
      );
    }


    setNotice(
      "Connecting to the lyric generation service..."
    );


    try {
      const response =
        await fetch(
          `${API_URL}/api/lyrics`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                theme:
                  theme.trim(),

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
        "Nepali lyrics generated successfully."
      );

    } catch (error) {

      if (
        error instanceof Error
      ) {
        setNotice(
          error.message
        );

      } else {
        setNotice(
          "Unable to generate lyrics."
        );
      }

    } finally {
      setIsGeneratingLyrics(
        false
      );
    }
  }


  // ============================================================
  // GENERATE MUSIC
  // ============================================================

  async function handleGenerateMusic() {
    if (
      !generatedLyrics.trim()
    ) {
      setNotice(
        "Generate or write the lyrics before creating music."
      );

      return;
    }


    if (
      instruments.length === 0
    ) {
      setNotice(
        "Select at least one traditional instrument."
      );

      return;
    }


    setIsGeneratingMusic(
      true
    );


    setNotice(
      "ACE-Step is creating your Nepali folk song. Please keep this page open while the music is generated."
    );


    // Remove the previous song before
    // generating a new one.
    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );

      setAudioUrl(
        ""
      );
    }


    try {
      const response =
        await fetch(
          `${API_URL}/api/music`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                theme:
                  theme.trim(),

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


      // ========================================================
      // HANDLE ERROR RESPONSE
      // ========================================================

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


      // ========================================================
      // RECEIVE WAV FROM FASTAPI
      // ========================================================

      const audioBlob =
        await response.blob();


      if (
        audioBlob.size === 0
      ) {
        throw new Error(
          "The music service returned an empty audio file."
        );
      }


      // ========================================================
      // CREATE PLAYABLE BROWSER URL
      // ========================================================

      const newAudioUrl =
        URL.createObjectURL(
          audioBlob
        );


      setAudioUrl(
        newAudioUrl
      );


      await fetchMySongs();


      setNotice(
        "Your Nepali folk song was generated successfully and saved to My Songs."
      );

    } catch (error) {

      if (
        error instanceof Error
      ) {
        setNotice(
          error.message
        );

      } else {
        setNotice(
          "Unable to generate music."
        );
      }

    } finally {
      setIsGeneratingMusic(
        false
      );
    }
  }


  // ============================================================
  // STATUS
  // ============================================================

  const backendOnline =
    health?.status === "ok";

  const gpuOnline =
    health?.gpu === "online";

  const isBusy =
    isGeneratingLyrics ||
    isGeneratingMusic;


  // ============================================================
  // AUTHENTICATION SCREEN
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


  if (
    !currentUser ||
    !accessToken
  ) {
    return (
      <main
        className="
          studio-grid
          relative
          min-h-screen
          overflow-hidden
          px-5
          py-10
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            -left-40
            top-40
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
            top-10
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
            min-h-[calc(100vh-5rem)]
            max-w-6xl
            items-center
            gap-10
            lg:grid-cols-[1.05fr_0.95fr]
          "
        >
          <section>
            <div
              className="
                mb-5
                inline-flex
                rounded-full
                border
                border-amber-200/10
                bg-amber-100/[0.04]
                px-4
                py-2
                text-xs
                tracking-[0.18em]
                text-amber-200/80
                uppercase
              "
            >
              नेपाली लोक संगीत • AI
            </div>

            <h1
              className="
                max-w-2xl
                text-4xl
                font-semibold
                leading-tight
                tracking-[-0.04em]
                text-white
                sm:text-5xl
                lg:text-6xl
              "
            >
              Your personal{" "}
              <span className="gold-text">
                Nepali Folk Studio.
              </span>
            </h1>

            <p
              className="
                mt-6
                max-w-xl
                text-base
                leading-7
                text-neutral-400
              "
            >
              Sign in to generate Nepali lyrics and music,
              keep every completed song in your private
              library, and return to your creations later.
            </p>

            <div
              className="
                mt-8
                flex
                flex-wrap
                gap-3
                text-xs
                text-neutral-500
              "
            >
              <span
                className="
                  rounded-full
                  border
                  border-white/7
                  bg-white/[0.025]
                  px-3
                  py-2
                "
              >
                Gemma-3-4B Lyrics
              </span>

              <span
                className="
                  rounded-full
                  border
                  border-white/7
                  bg-white/[0.025]
                  px-3
                  py-2
                "
              >
                ACE-Step Music
              </span>

              <span
                className="
                  rounded-full
                  border
                  border-white/7
                  bg-white/[0.025]
                  px-3
                  py-2
                "
              >
                Private Song Library
              </span>
            </div>
          </section>

          <section
            className="
              glass-panel
              rounded-[28px]
              p-6
              sm:p-8
            "
          >
            <div
              className="
                mb-7
                flex
                items-center
                justify-between
                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    tracking-[0.18em]
                    text-amber-300/70
                    uppercase
                  "
                >
                  Account
                </p>

                <h2
                  className="
                    mt-2
                    text-2xl
                    font-semibold
                    text-white
                  "
                >
                  {authMode === "login"
                    ? "Welcome back"
                    : "Create your account"}
                </h2>
              </div>

              <div
                className="
                  flex
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
                    px-3
                    py-2
                    text-xs
                    transition
                    ${
                      authMode === "login"
                        ? "bg-white/10 text-white"
                        : "text-neutral-500"
                    }
                  `}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthNotice("");
                  }}
                  className={`
                    rounded-lg
                    px-3
                    py-2
                    text-xs
                    transition
                    ${
                      authMode === "register"
                        ? "bg-white/10 text-white"
                        : "text-neutral-500"
                    }
                  `}
                >
                  Register
                </button>
              </div>
            </div>

            <div className="space-y-4">
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
                    disabled={isAuthenticating}
                    onChange={(event) =>
                      setAuthName(
                        event.target.value
                      )
                    }
                    placeholder="Your name"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-white/8
                      bg-black/20
                      px-4
                      py-3
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-neutral-600
                      focus:border-amber-300/30
                    "
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
                  disabled={isAuthenticating}
                  onChange={(event) =>
                    setAuthEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-white/8
                    bg-black/20
                    px-4
                    py-3
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-neutral-600
                    focus:border-amber-300/30
                  "
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
                  disabled={isAuthenticating}
                  onChange={(event) =>
                    setAuthPassword(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !isAuthenticating
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
                  placeholder="At least 8 characters"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-white/8
                    bg-black/20
                    px-4
                    py-3
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-neutral-600
                    focus:border-amber-300/30
                  "
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
                  gap-3
                  rounded-2xl
                  px-6
                  py-4
                  text-sm
                  font-semibold
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {isAuthenticating
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Sign in to Studio"
                    : "Create Account"}
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }


  return (
    <main
      className="
        studio-grid
        relative
        min-h-screen
        overflow-hidden
      "
    >

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-40
          top-40
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
          top-10
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
          max-w-7xl
          px-5
          pb-16
          pt-6
          sm:px-8
          lg:px-10
        "
      >

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header
          className="
            flex
            items-center
            justify-between
            py-3
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
                h-11
                w-11
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
                  text-sm
                  font-semibold
                  tracking-wide
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
                AI music research project
              </p>

            </div>

          </div>


          {/* Service indicators */}

          <div
            className="
              hidden
              items-center
              gap-3
              sm:flex
            "
          >

            {/* Backend */}

            <div
              className="
                flex
                items-center
                gap-2
                rounded-full
                border
                border-white/8
                bg-white/[0.03]
                px-4
                py-2
                text-xs
                text-neutral-400
              "
            >

              <span
                className={`
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

              <span
                className="
                  text-neutral-200
                "
              >
                {
                  backendOnline
                    ? "Online"
                    : "Offline"
                }
              </span>

            </div>


            {/* GPU */}

            <div
              className="
                flex
                items-center
                gap-2
                rounded-full
                border
                border-white/8
                bg-white/[0.03]
                px-4
                py-2
                text-xs
                text-neutral-400
              "
            >

              <span
                className={`
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

              GPU

              <span
                className="
                  text-neutral-200
                "
              >
                {
                  gpuOnline
                    ? "Online"
                    : "Offline"
                }
              </span>

            </div>


            <div
              className="
                flex
                items-center
                gap-2
                rounded-full
                border
                border-white/8
                bg-white/[0.03]
                px-3
                py-2
              "
            >
              <span
                className="
                  max-w-28
                  truncate
                  text-xs
                  text-neutral-300
                "
                title={currentUser.email}
              >
                {currentUser.name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  rounded-full
                  border
                  border-white/7
                  px-2.5
                  py-1
                  text-[11px]
                  text-neutral-500
                  transition
                  hover:text-white
                "
              >
                Logout
              </button>
            </div>

          </div>

        </header>


        {/* =====================================================
            HERO
        ====================================================== */}

        <section
          className="
            mx-auto
            max-w-3xl
            pb-12
            pt-20
            text-center
            lg:pt-24
          "
        >

          <div
            className="
              mx-auto
              mb-5
              inline-flex
              items-center
              rounded-full
              border
              border-amber-200/10
              bg-amber-100/[0.04]
              px-4
              py-2
              text-xs
              tracking-[0.18em]
              text-amber-200/80
              uppercase
            "
          >
            नेपाली लोक संगीत • AI
          </div>


          <h1
            className="
              text-4xl
              font-semibold
              leading-tight
              tracking-[-0.04em]
              text-white
              sm:text-5xl
              lg:text-6xl
            "
          >
            Turn your story into{" "}

            <span className="gold-text">
              Nepali folk music.
            </span>

          </h1>


          <p
            className="
              mx-auto
              mt-6
              max-w-2xl
              text-base
              leading-7
              text-neutral-400
              sm:text-lg
            "
          >
            Describe an idea.
            Generate original Nepali
            lyrics, shape the folk
            arrangement, and create a
            complete song powered by
            your fine-tuned AI models.
          </p>

        </section>


        {/* =====================================================
            MAIN WORKSPACE
        ====================================================== */}

        <section
          className="
            grid
            gap-6
            lg:grid-cols-[1.45fr_0.75fr]
          "
        >

          {/* =================================================
              LEFT GENERATOR PANEL
          ================================================== */}

          <div
            className="
              glass-panel
              rounded-[28px]
              p-5
              sm:p-7
              lg:p-8
            "
          >

            <div
              className="
                mb-8
                flex
                items-start
                justify-between
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    font-medium
                    tracking-[0.18em]
                    text-amber-300/70
                    uppercase
                  "
                >
                  Create
                </p>


                <h2
                  className="
                    mt-2
                    text-2xl
                    font-semibold
                    tracking-tight
                    text-white
                  "
                >
                  Design your song
                </h2>


                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-neutral-500
                  "
                >
                  Start with the story
                  you want the song to
                  tell.
                </p>

              </div>


              <div
                className="
                  rounded-full
                  border
                  border-white/8
                  bg-white/[0.03]
                  px-3
                  py-1.5
                  text-xs
                  text-neutral-500
                "
              >
                {
                  audioUrl
                    ? "Step 3 of 3"
                    : generatedLyrics
                      ? "Step 2 of 3"
                      : "Step 1 of 3"
                }
              </div>

            </div>


            {/* =================================================
                SONG IDEA
            ================================================== */}

            <div>

              <div
                className="
                  mb-3
                  flex
                  items-center
                  justify-between
                "
              >

                <label
                  htmlFor="song-theme"
                  className="
                    text-sm
                    font-medium
                    text-neutral-200
                  "
                >
                  What should your
                  song be about?
                </label>


                <span
                  className="
                    text-xs
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
                disabled={
                  isBusy
                }
                onChange={(event) =>
                  setTheme(
                    event.target.value
                  )
                }
                placeholder="For example: A young man returns to his mountain village after many years and remembers his childhood..."
                className="
                  min-h-36
                  w-full
                  resize-none
                  rounded-2xl
                  border
                  border-white/8
                  bg-black/20
                  px-5
                  py-4
                  text-sm
                  leading-6
                  text-white
                  outline-none
                  transition
                  placeholder:text-neutral-600
                  focus:border-amber-300/30
                  focus:ring-2
                  focus:ring-amber-300/5
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

            </div>


            {/* =================================================
                MOOD
            ================================================== */}

            <div className="mt-8">

              <p
                className="
                  mb-3
                  text-sm
                  font-medium
                  text-neutral-200
                "
              >
                Mood
              </p>


              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  sm:grid-cols-4
                "
              >

                {moods.map(
                  (item) => {

                    const selected =
                      mood === item.id;


                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        disabled={
                          isBusy
                        }
                        onClick={() =>
                          setMood(
                            item.id
                          )
                        }
                        className={`
                          rounded-2xl
                          border
                          px-4
                          py-4
                          text-left
                          transition
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                          ${
                            selected
                              ? "border-amber-300/30 bg-amber-200/[0.08]"
                              : "border-white/7 bg-white/[0.025] hover:bg-white/[0.045]"
                          }
                        `}
                      >

                        <div
                          className="
                            mb-3
                            text-lg
                            text-amber-200
                          "
                        >
                          {item.icon}
                        </div>


                        <p
                          className="
                            text-sm
                            font-medium
                            text-white
                          "
                        >
                          {item.label}
                        </p>


                        <p
                          className="
                            mt-1
                            text-xs
                            text-neutral-500
                          "
                        >
                          {item.english}
                        </p>

                      </button>
                    );
                  }
                )}

              </div>

            </div>


            {/* =================================================
                INSTRUMENTS
            ================================================== */}

            <div className="mt-8">

              <p
                className="
                  mb-3
                  text-sm
                  font-medium
                  text-neutral-200
                "
              >
                Traditional instruments
              </p>


              <div
                className="
                  flex
                  flex-wrap
                  gap-3
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
                        type="button"
                        key={
                          instrument.id
                        }
                        disabled={
                          isBusy
                        }
                        onClick={() =>
                          toggleInstrument(
                            instrument.id
                          )
                        }
                        className={`
                          flex
                          items-center
                          gap-3
                          rounded-full
                          border
                          px-4
                          py-3
                          text-sm
                          transition
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                          ${
                            selected
                              ? "border-emerald-300/25 bg-emerald-300/[0.07] text-white"
                              : "border-white/7 bg-white/[0.025] text-neutral-500"
                          }
                        `}
                      >

                        <span
                          className={`
                            flex
                            h-5
                            w-5
                            items-center
                            justify-center
                            rounded-full
                            text-[10px]
                            ${
                              selected
                                ? "bg-emerald-300 text-neutral-950"
                                : "bg-white/5"
                            }
                          `}
                        >
                          {
                            selected
                              ? "✓"
                              : "+"
                          }
                        </span>


                        <span>
                          {
                            instrument.label
                          }
                        </span>


                        <span
                          className="
                            text-xs
                            text-neutral-600
                          "
                        >
                          {
                            instrument.nepali
                          }
                        </span>

                      </button>
                    );
                  }
                )}

              </div>

            </div>


            {/* =================================================
                VOCAL STYLE
            ================================================== */}

            <div className="mt-8">

              <div
                className="
                  mb-3
                  flex
                  items-end
                  justify-between
                  gap-4
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                      font-medium
                      text-neutral-200
                    "
                  >
                    Vocal style
                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-neutral-600
                    "
                  >
                    Choose the singer setup
                    for the final ACE-Step
                    song.
                  </p>

                </div>


                <span
                  className="
                    hidden
                    rounded-full
                    border
                    border-amber-300/10
                    bg-amber-300/[0.04]
                    px-3
                    py-1
                    text-[11px]
                    text-amber-200/70
                    sm:inline-flex
                  "
                >
                  ACE vocal
                </span>

              </div>


              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  sm:grid-cols-3
                "
              >

                {vocalOptions.map(
                  (item) => {

                    const selected =
                      vocalStyle ===
                      item.id;


                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        disabled={
                          isBusy
                        }
                        onClick={() =>
                          setVocalStyle(
                            item.id
                          )
                        }
                        className={`
                          rounded-2xl
                          border
                          px-4
                          py-4
                          text-left
                          transition
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                          ${
                            selected
                              ? "border-amber-300/30 bg-amber-200/[0.08]"
                              : "border-white/7 bg-white/[0.025] hover:bg-white/[0.045]"
                          }
                        `}
                      >

                        <div
                          className="
                            flex
                            items-start
                            justify-between
                            gap-3
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
                              {
                                item.label
                              }
                            </p>


                            <p
                              className="
                                mt-1
                                text-xs
                                text-neutral-500
                              "
                            >
                              {
                                item.nepali
                              }
                            </p>

                          </div>


                          <span
                            className={`
                              flex
                              h-5
                              w-5
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              text-[10px]
                              ${
                                selected
                                  ? "bg-amber-200 text-neutral-950"
                                  : "bg-white/5 text-neutral-600"
                              }
                            `}
                          >
                            {
                              selected
                                ? "✓"
                                : ""
                            }
                          </span>

                        </div>


                        <p
                          className="
                            mt-3
                            text-[11px]
                            leading-4
                            text-neutral-600
                          "
                        >
                          {
                            item.description
                          }
                        </p>

                      </button>
                    );
                  }
                )}

              </div>


              <p
                className="
                  mt-3
                  text-xs
                  leading-5
                  text-neutral-600
                "
              >
                This selection is sent only
                when generating the final
                music. Lyric generation is
                unchanged.
              </p>

            </div>


            {/* =================================================
                DURATION
            ================================================== */}

            <div className="mt-8">

              <p
                className="
                  mb-3
                  text-sm
                  font-medium
                  text-neutral-200
                "
              >
                Song length
              </p>


              <div
                className="
                  grid
                  grid-cols-3
                  gap-3
                "
              >

                {durations.map(
                  (item) => {

                    const selected =
                      duration ===
                      item.seconds;


                    return (
                      <button
                        key={
                          item.seconds
                        }
                        type="button"
                        disabled={
                          isBusy
                        }
                        onClick={() =>
                          setDuration(
                            item.seconds
                          )
                        }
                        className={`
                          rounded-xl
                          border
                          px-3
                          py-3
                          text-sm
                          transition
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                          ${
                            selected
                              ? "border-amber-300/25 bg-amber-200/[0.07] text-amber-100"
                              : "border-white/7 bg-white/[0.02] text-neutral-500 hover:text-neutral-300"
                          }
                        `}
                      >
                        {item.label}
                      </button>
                    );
                  }
                )}

              </div>

            </div>


            {/* =================================================
                GENERATE LYRICS BUTTON
            ================================================== */}

            <div
              className="
                mt-9
                border-t
                border-white/6
                pt-6
              "
            >

              <button
                type="button"
                onClick={
                  handleGenerateLyrics
                }
                disabled={
                  isBusy
                }
                className="
                  generate-button
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-3
                  rounded-2xl
                  px-6
                  py-4
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
                  {
                    isGeneratingLyrics
                      ? "◌"
                      : "✦"
                  }
                </span>


                {
                  isGeneratingLyrics
                    ? "Generating..."
                    : "Generate Nepali Lyrics"
                }


                {
                  !isGeneratingLyrics && (
                    <span>
                      →
                    </span>
                  )
                }

              </button>


              {/* =================================================
                  NOTICE
              ================================================== */}

              {notice && (
                <div
                  className="
                    fade-in
                    mt-4
                    rounded-xl
                    border
                    border-white/6
                    bg-white/[0.025]
                    px-4
                    py-3
                    text-center
                  "
                >

                  <p
                    className="
                      text-xs
                      leading-5
                      text-neutral-400
                    "
                  >
                    {notice}
                  </p>

                </div>
              )}


              {/* =================================================
                  GENERATED LYRICS
              ================================================== */}

              {generatedLyrics && (
                <div
                  className="
                    fade-in
                    mt-6
                    rounded-2xl
                    border
                    border-amber-300/10
                    bg-black/20
                    p-5
                  "
                >

                  <div
                    className="
                      mb-4
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <div>

                      <p
                        className="
                          text-xs
                          tracking-[0.15em]
                          text-amber-300/60
                          uppercase
                        "
                      >
                        Generated Lyrics
                      </p>


                      <p
                        className="
                          mt-1
                          text-sm
                          font-medium
                          text-white
                        "
                      >
                        नेपाली गीतका शब्द
                      </p>

                    </div>


                    <span
                      className="
                        rounded-full
                        border
                        border-emerald-300/10
                        bg-emerald-300/[0.05]
                        px-3
                        py-1
                        text-xs
                        text-emerald-300
                      "
                    >
                      Ready
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

                      // Editing lyrics invalidates
                      // the previously generated song.
                      if (audioUrl) {
                        URL.revokeObjectURL(
                          audioUrl
                        );

                        setAudioUrl(
                          ""
                        );
                      }
                    }}
                    className="
                      min-h-80
                      w-full
                      resize-y
                      rounded-xl
                      border
                      border-white/7
                      bg-black/20
                      px-4
                      py-4
                      text-sm
                      leading-8
                      text-neutral-200
                      outline-none
                      focus:border-amber-300/20
                      disabled:cursor-not-allowed
                      disabled:opacity-70
                    "
                  />


                  <p
                    className="
                      mt-3
                      text-xs
                      leading-5
                      text-neutral-600
                    "
                  >
                    You can edit the lyrics
                    before sending them to
                    ACE-Step.
                  </p>


                  {/* ===========================================
                      GENERATE MUSIC
                  ============================================ */}

                  <div
                    className="
                      mt-6
                      border-t
                      border-white/6
                      pt-5
                    "
                  >

                    <button
                      type="button"
                      onClick={
                        handleGenerateMusic
                      }
                      disabled={
                        isBusy
                      }
                      className="
                        generate-button
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-3
                        rounded-2xl
                        px-6
                        py-4
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
                        {
                          isGeneratingMusic
                            ? "◌"
                            : "♫"
                        }
                      </span>


                      {
                        isGeneratingMusic
                          ? "Creating Nepali Folk Music..."
                          : "Generate Full Folk Song"
                      }


                      {
                        !isGeneratingMusic && (
                          <span>
                            →
                          </span>
                        )
                      }

                    </button>


                    {/* Music generation status */}

                    {isGeneratingMusic && (
                      <div
                        className="
                          mt-4
                          rounded-xl
                          border
                          border-amber-300/10
                          bg-amber-300/[0.03]
                          px-4
                          py-4
                        "
                      >

                        <p
                          className="
                            text-center
                            text-xs
                            leading-5
                            text-amber-100/70
                          "
                        >
                          ACE-Step is
                          generating the vocal
                          and traditional
                          Nepali folk
                          arrangement on GPU 1.
                        </p>

                      </div>
                    )}


                    {/* =========================================
                        AUDIO PLAYER
                    ========================================== */}

                    {audioUrl && (
                      <div
                        className="
                          fade-in
                          mt-5
                          rounded-2xl
                          border
                          border-emerald-300/10
                          bg-emerald-300/[0.03]
                          p-5
                        "
                      >

                        <div
                          className="
                            mb-4
                            flex
                            items-center
                            justify-between
                            gap-4
                          "
                        >

                          <div>

                            <p
                              className="
                                text-xs
                                tracking-[0.15em]
                                text-emerald-300/60
                                uppercase
                              "
                            >
                              Generated Song
                            </p>


                            <p
                              className="
                                mt-1
                                text-sm
                                font-medium
                                text-white
                              "
                            >
                              नेपाली लोक संगीत
                            </p>

                          </div>


                          <span
                            className="
                              rounded-full
                              border
                              border-emerald-300/10
                              bg-emerald-300/[0.05]
                              px-3
                              py-1
                              text-xs
                              text-emerald-300
                            "
                          >
                            Ready
                          </span>

                        </div>


                        <audio
                          controls
                          preload="metadata"
                          src={
                            audioUrl
                          }
                          className="
                            w-full
                          "
                        />


                        <div
                          className="
                            mt-3
                            flex
                            flex-wrap
                            items-center
                            gap-2
                            text-xs
                            text-neutral-600
                          "
                        >

                          <span>
                            Generated with
                            ACE-Step 1.5 Turbo
                            + Nepali Folk LoRA.
                          </span>


                          <span
                            className="
                              rounded-full
                              border
                              border-white/7
                              bg-white/[0.025]
                              px-2.5
                              py-1
                              text-neutral-400
                            "
                          >
                            Vocal: {
                              vocalOptions.find(
                                (item) =>
                                  item.id ===
                                  vocalStyle
                              )?.label ??
                              vocalStyle
                            }
                          </span>

                        </div>

                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

          </div>


          {/* =================================================
              RIGHT SIDE
          ================================================== */}

          <aside
            className="
              flex
              flex-col
              gap-5
            "
          >

            {/* =================================================
                STUDIO PREVIEW
            ================================================== */}

            <div
              className="
                glass-panel
                relative
                overflow-hidden
                rounded-[28px]
                p-6
              "
            >

              <div
                className="
                  absolute
                  right-0
                  top-0
                  h-40
                  w-40
                  rounded-full
                  bg-amber-400/[0.04]
                  blur-3xl
                "
              />


              <p
                className="
                  relative
                  text-xs
                  tracking-[0.18em]
                  text-neutral-500
                  uppercase
                "
              >
                Studio Preview
              </p>


              <div
                className="
                  relative
                  mt-10
                  flex
                  h-28
                  items-center
                  justify-center
                  gap-1.5
                "
              >

                {[
                  28,
                  50,
                  74,
                  38,
                  90,
                  62,
                  45,
                  80,
                  55,
                  96,
                  63,
                  42,
                  78,
                  52,
                  31,
                  70,
                ].map(
                  (
                    height,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className={`
                        wave-bar
                        w-1.5
                        rounded-full
                        bg-gradient-to-t
                        from-amber-700
                        to-amber-200
                        opacity-70
                        ${
                          isGeneratingMusic
                            ? ""
                            : ""
                        }
                      `}
                      style={{
                        height:
                          `${height}%`,

                        animationDelay:
                          `${index * 0.06}s`,
                      }}
                    />
                  )
                )}

              </div>


              <div
                className="
                  relative
                  mt-6
                "
              >

                <p
                  className="
                    text-lg
                    font-medium
                    text-white
                  "
                >
                  {
                    audioUrl
                      ? "Your Nepali folk song is ready"
                      : isGeneratingMusic
                        ? "Creating your folk arrangement..."
                        : generatedLyrics
                          ? "Lyrics ready for review"
                          : "Your folk song will appear here"
                  }
                </p>


                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-neutral-500
                  "
                >
                  {
                    audioUrl
                      ? `Your song was generated with the selected ${vocalOptions.find((item) => item.id === vocalStyle)?.label ?? vocalStyle} vocal style and traditional instruments.`
                      : isGeneratingMusic
                        ? `ACE-Step is generating the ${vocalOptions.find((item) => item.id === vocalStyle)?.label ?? vocalStyle} vocal and traditional Nepali folk arrangement.`
                        : generatedLyrics
                          ? "Review or edit the Nepali lyrics before generating the final music."
                          : "Generate the lyrics, review them, then send them to the ACE-Step music model."
                  }
                </p>

              </div>

            </div>


            {/* =================================================
                GENERATION FLOW
            ================================================== */}

            <div
              className="
                glass-panel
                rounded-[28px]
                p-6
              "
            >

              <p
                className="
                  text-xs
                  tracking-[0.18em]
                  text-neutral-500
                  uppercase
                "
              >
                Generation flow
              </p>


              <div
                className="
                  mt-6
                  space-y-5
                "
              >

                <FlowStep
                  number="01"
                  title="Write the lyrics"
                  description="Gemma-3-4B + your Nepali lyrics LoRA"
                  active={
                    !generatedLyrics
                  }
                />


                <FlowStep
                  number="02"
                  title="Review & edit"
                  description="Keep full control of the generated lyrics"
                  active={
                    Boolean(
                      generatedLyrics
                    ) &&
                    !isGeneratingMusic &&
                    !audioUrl
                  }
                />


                <FlowStep
                  number="03"
                  title="Create the music"
                  description="ACE-Step 1.5 + your Nepali folk LoRA"
                  active={
                    isGeneratingMusic ||
                    Boolean(
                      audioUrl
                    )
                  }
                />

              </div>

            </div>


            {/* =================================================
                SERVICE STATUS
            ================================================== */}

            <div
              className="
                rounded-[24px]
                border
                border-white/7
                bg-black/20
                p-5
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
                      text-sm
                      font-medium
                      text-neutral-200
                    "
                  >
                    Generation service
                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-neutral-600
                    "
                  >
                    Kaggle GPU connection
                  </p>

                </div>


                <div
                  className={`
                    rounded-full
                    border
                    px-3
                    py-1.5
                    text-xs
                    ${
                      gpuOnline
                        ? "border-emerald-300/10 bg-emerald-300/[0.05] text-emerald-300"
                        : "border-amber-300/10 bg-amber-300/[0.05] text-amber-200/80"
                    }
                  `}
                >
                  {
                    gpuOnline
                      ? "Online"
                      : "Offline"
                  }
                </div>

              </div>

            </div>


            {/* =================================================
                MODEL INFORMATION
            ================================================== */}

            <div
              className="
                rounded-[24px]
                border
                border-white/7
                bg-white/[0.02]
                p-5
              "
            >

              <p
                className="
                  text-xs
                  tracking-[0.18em]
                  text-neutral-600
                  uppercase
                "
              >
                AI Models
              </p>


              <div
                className="
                  mt-5
                  space-y-4
                "
              >

                <div
                  className="
                    rounded-xl
                    border
                    border-white/6
                    bg-black/10
                    p-4
                  "
                >

                  <p
                    className="
                      text-sm
                      text-neutral-300
                    "
                  >
                    Lyrics
                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-neutral-600
                    "
                  >
                    Gemma-3-4B +
                    Nepali Lyrics LoRA
                  </p>

                </div>


                <div
                  className="
                    rounded-xl
                    border
                    border-white/6
                    bg-black/10
                    p-4
                  "
                >

                  <p
                    className="
                      text-sm
                      text-neutral-300
                    "
                  >
                    Music
                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-neutral-600
                    "
                  >
                    ACE-Step 1.5 Turbo +
                    Nepali Folk LoRA
                  </p>

                </div>

              </div>

            </div>

          </aside>

        </section>


        {/* =====================================================
            MY SONGS
        ====================================================== */}

        <section
          className="
            mt-8
            glass-panel
            rounded-[28px]
            p-5
            sm:p-7
            lg:p-8
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <p
                className="
                  text-xs
                  font-medium
                  tracking-[0.18em]
                  text-amber-300/70
                  uppercase
                "
              >
                Library
              </p>

              <h2
                className="
                  mt-2
                  text-2xl
                  font-semibold
                  tracking-tight
                  text-white
                "
              >
                My Songs
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-neutral-500
                "
              >
                Completed songs saved to your private account.
              </p>
            </div>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <span
                className="
                  rounded-full
                  border
                  border-white/7
                  bg-white/[0.025]
                  px-3
                  py-2
                  text-xs
                  text-neutral-500
                "
              >
                {songs.length} {songs.length === 1 ? "song" : "songs"}
              </span>

              <button
                type="button"
                disabled={isLoadingSongs}
                onClick={() =>
                  fetchMySongs()
                }
                className="
                  rounded-full
                  border
                  border-white/8
                  bg-white/[0.03]
                  px-4
                  py-2
                  text-xs
                  text-neutral-300
                  transition
                  hover:bg-white/[0.06]
                  disabled:opacity-50
                "
              >
                {isLoadingSongs
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </div>


          {isLoadingSongs &&
            songs.length === 0 && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-white/7
                  bg-black/15
                  px-5
                  py-8
                  text-center
                  text-sm
                  text-neutral-500
                "
              >
                Loading your songs...
              </div>
            )}


          {!isLoadingSongs &&
            songs.length === 0 && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-dashed
                  border-white/8
                  bg-black/10
                  px-6
                  py-10
                  text-center
                "
              >
                <p
                  className="
                    text-sm
                    font-medium
                    text-neutral-300
                  "
                >
                  No saved songs yet
                </p>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-lg
                    text-xs
                    leading-5
                    text-neutral-600
                  "
                >
                  Generate a complete folk song above. The WAV and its
                  generation settings will automatically appear here.
                </p>
              </div>
            )}


          {songs.length > 0 && (
            <div
              className="
                mt-6
                grid
                gap-4
                lg:grid-cols-2
              "
            >
              {songs.map(
                (song) => {
                  const savedAudioUrl =
                    songAudioUrls[
                      song.id
                    ];

                  const vocalLabel =
                    vocalOptions.find(
                      (item) =>
                        item.id ===
                        song.vocal_style
                    )?.label ??
                    song.vocal_style;

                  const busy =
                    songActionId ===
                    song.id;


                  return (
                    <article
                      key={song.id}
                      className="
                        rounded-2xl
                        border
                        border-white/7
                        bg-black/15
                        p-5
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-4
                        "
                      >
                        <div
                          className="min-w-0"
                        >
                          <p
                            className="
                              text-[11px]
                              tracking-[0.14em]
                              text-amber-300/60
                              uppercase
                            "
                          >
                            Song #{song.id}
                          </p>

                          <h3
                            className="
                              mt-2
                              line-clamp-2
                              text-base
                              font-medium
                              text-white
                            "
                          >
                            {song.theme?.trim() ||
                              "Nepali folk song"}
                          </h3>

                          <p
                            className="
                              mt-2
                              text-xs
                              text-neutral-600
                            "
                          >
                            {new Date(
                              song.created_at
                            ).toLocaleString()}
                          </p>
                        </div>

                        <span
                          className="
                            shrink-0
                            rounded-full
                            border
                            border-emerald-300/10
                            bg-emerald-300/[0.05]
                            px-3
                            py-1
                            text-[11px]
                            text-emerald-300
                          "
                        >
                          {song.status}
                        </span>
                      </div>


                      <div
                        className="
                          mt-4
                          flex
                          flex-wrap
                          gap-2
                        "
                      >
                        <span
                          className="
                            rounded-full
                            border
                            border-white/7
                            bg-white/[0.025]
                            px-2.5
                            py-1
                            text-[11px]
                            text-neutral-400
                          "
                        >
                          {song.mood}
                        </span>

                        <span
                          className="
                            rounded-full
                            border
                            border-white/7
                            bg-white/[0.025]
                            px-2.5
                            py-1
                            text-[11px]
                            text-neutral-400
                          "
                        >
                          {song.duration}s
                        </span>

                        <span
                          className="
                            rounded-full
                            border
                            border-white/7
                            bg-white/[0.025]
                            px-2.5
                            py-1
                            text-[11px]
                            text-neutral-400
                          "
                        >
                          {vocalLabel}
                        </span>

                        <span
                          className="
                            rounded-full
                            border
                            border-white/7
                            bg-white/[0.025]
                            px-2.5
                            py-1
                            text-[11px]
                            text-neutral-400
                          "
                        >
                          {song.instruments.join(
                            " · "
                          )}
                        </span>
                      </div>


                      {savedAudioUrl ? (
                        <audio
                          controls
                          preload="metadata"
                          src={savedAudioUrl}
                          className="
                            mt-5
                            w-full
                          "
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            loadSavedSongAudio(
                              song
                            )
                          }
                          className="
                            mt-5
                            w-full
                            rounded-xl
                            border
                            border-amber-300/15
                            bg-amber-300/[0.04]
                            px-4
                            py-3
                            text-xs
                            font-medium
                            text-amber-100/80
                            transition
                            hover:bg-amber-300/[0.07]
                            disabled:opacity-50
                          "
                        >
                          {busy
                            ? "Loading audio..."
                            : "Load & Play"}
                        </button>
                      )}


                      <details
                        className="
                          mt-4
                          rounded-xl
                          border
                          border-white/6
                          bg-black/10
                          px-4
                          py-3
                        "
                      >
                        <summary
                          className="
                            cursor-pointer
                            text-xs
                            text-neutral-400
                          "
                        >
                          View lyrics
                        </summary>

                        <pre
                          className="
                            mt-4
                            whitespace-pre-wrap
                            font-sans
                            text-xs
                            leading-6
                            text-neutral-500
                          "
                        >
                          {song.lyrics}
                        </pre>
                      </details>


                      <div
                        className="
                          mt-4
                          flex
                          flex-wrap
                          gap-2
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
                            rounded-xl
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
                          Download WAV
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            deleteSavedSong(
                              song
                            )
                          }
                          className="
                            rounded-xl
                            border
                            border-red-300/10
                            bg-red-300/[0.03]
                            px-4
                            py-2.5
                            text-xs
                            text-red-200/70
                            transition
                            hover:bg-red-300/[0.06]
                            disabled:opacity-50
                          "
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>


        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer
          className="
            mt-14
            flex
            flex-col
            gap-2
            border-t
            border-white/5
            pt-6
            text-xs
            text-neutral-600
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <p>
            Nepali Folk Studio
          </p>


          <p>
            Gemma-3-4B × ACE-Step 1.5
          </p>

        </footer>

      </div>

    </main>
  );
}


function FlowStep({
  number,
  title,
  description,
  active = false,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className="
        flex
        gap-4
      "
    >

      <div
        className={`
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          border
          text-xs
          ${
            active
              ? "border-amber-300/25 bg-amber-300/[0.08] text-amber-200"
              : "border-white/7 bg-white/[0.025] text-neutral-600"
          }
        `}
      >
        {number}
      </div>


      <div>

        <p
          className={`
            text-sm
            font-medium
            ${
              active
                ? "text-white"
                : "text-neutral-400"
            }
          `}
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
          {description}
        </p>

      </div>

    </div>
  );
}