/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [entered, setEntered] = useState(() => Boolean(typeof window !== 'undefined' && (window as any).__entered));
  const [views, setViews] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [prevVolume, setPrevVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showUidTooltip, setShowUidTooltip] = useState(false);
  const [showViewsTooltip, setShowViewsTooltip] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync with native first-frame click listener
  useEffect(() => {
    const handleNativeEnter = () => {
      setEntered(true);
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('app:entered', handleNativeEnter);
    if ((window as any).__entered) {
      handleNativeEnter();
    }
    return () => window.removeEventListener('app:entered', handleNativeEnter);
  }, [isMuted, volume]);

  // View Counter: Every visitor/entry increments the view counter
  useEffect(() => {
    fetch('/api/views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === 'number') {
          setViews(data.count);
        }
      })
      .catch(() => {
        setViews((prev) => prev + 1);
      });
  }, []);

  // Guns.lol animated title in browser tab:
  // Types and untypes "@OMAR33" next to the purple gun favicon
  useEffect(() => {
    const target = 'OMAR33';
    let r = 0;
    let a = true;

    const interval = setInterval(() => {
      if (r === target.length) {
        a = false;
      }
      if (r === 0) {
        a = true;
      }

      r = a ? r + 1 : r - 1;
      const current = r === 0 ? '' : target.slice(0, r);
      document.title = '@' + current;
    }, 380);

    return () => clearInterval(interval);
  }, []);

  // Instant 0ms response on click
  const handleEnter = () => {
    (window as any).__entered = true;
    const el = document.getElementById('initial-entry-overlay');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
    setEntered(true);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play().catch(() => {});
    }
  };

  // Handle volume changes from slider
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) / 100;
    setVolume(val);
    if (val > 0) {
      setIsMuted(false);
      setPrevVolume(val);
    } else {
      setIsMuted(true);
    }
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  // Toggle mute / restore previous volume
  const toggleMute = () => {
    if (isMuted || volume === 0) {
      const restored = prevVolume > 0 ? prevVolume : 0.8;
      setIsMuted(false);
      setVolume(restored);
      if (audioRef.current) {
        audioRef.current.volume = restored;
      }
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  };

  const currentVolumePercent = isMuted ? 0 : Math.round(volume * 100);

  return (
    <div className="relative min-h-screen w-full select-none overflow-hidden font-['Satoshi'] text-white">
      {/* Background audio element (optimized, instant playback) */}
      <audio
        ref={audioRef}
        src="/assets/audio.mp3"
        loop
        preload="auto"
      />

      {/* 1. Base solid dark background layer */}
      <div className="fixed inset-0 -z-20 bg-[#080808]" />

      {/* 2. New requested OMAR33 background */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none select-none"
        style={{
          backgroundImage: "url('/assets/omar33_bg.webp')",
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* 3. Night atmospheric overlay with balanced opacity to let the red OMAR33 battlefield shine */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.32)',
        }}
      />

      {/* "click to enter..." Overlay fallback */}
      {!entered && (
        <div
          onClick={handleEnter}
          className="fixed inset-0 z-[9999] flex cursor-pointer flex-col items-center justify-center gap-3.5 bg-black/75 backdrop-blur-[10px] select-none transition-opacity duration-150 active:opacity-80"
        >
          <div className="max-w-[1200px] px-2.5 text-center text-[30px] font-bold text-[#fafafa] tracking-wide active:scale-95 transition-transform duration-100">
            click to enter...
          </div>
        </div>
      )}

      {/* Volume Control Widget (Top Left) — exact guns.lol style with smooth expand & live slider */}
      <div
        onMouseEnter={() => setIsVolumeHovered(true)}
        onMouseLeave={() => setIsVolumeHovered(false)}
        className="fixed top-[15px] left-[15px] z-50 flex items-center gap-3.5 rounded-[15px] border-2 border-[rgba(27,27,27,0.45)] bg-[rgba(27,27,27,0.65)] backdrop-blur-[10px] px-3 py-2.5 shadow-2xl transition-all duration-300 ease-out"
        style={{
          width: isVolumeHovered ? '180px' : '48px',
          height: '48px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Speaker Icon Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="flex flex-shrink-0 cursor-pointer text-[24px] text-white hover:text-white/80 active:scale-95 transition-transform"
          title={isMuted || currentVolumePercent === 0 ? 'Unmute' : 'Mute'}
          aria-label="Toggle mute"
        >
          {isMuted || currentVolumePercent === 0 ? (
            /* Muted Speaker SVG */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 48 48"
              className="min-w-[24px]"
            >
              <g fill="none" stroke="currentColor" strokeWidth="4">
                <path
                  fill="currentColor"
                  strokeLinejoin="round"
                  d="M24 6v36c-7 0-12.201-9.16-12.201-9.16H6a2 2 0 0 1-2-2V17.01a2 2 0 0 1 2-2h5.799S17 6 24 6Z"
                />
                <path strokeLinecap="round" d="m32 20l12 12m0-12L32 32" />
              </g>
            </svg>
          ) : currentVolumePercent < 50 ? (
            /* Low Volume Speaker SVG */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 48 48"
              className="min-w-[24px]"
            >
              <g fill="none" stroke="currentColor" strokeWidth="4">
                <path
                  fill="currentColor"
                  strokeLinejoin="round"
                  d="M24 6v36c-7 0-12.201-9.16-12.201-9.16H6a2 2 0 0 1-2-2V17.01a2 2 0 0 1 2-2h5.799S17 6 24 6Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M32 18a7 7 0 0 1 0 12"
                />
              </g>
            </svg>
          ) : (
            /* High Volume Speaker SVG (exact guns.lol mask) */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 48 48"
              className="min-w-[24px]"
            >
              <defs>
                <mask id="ipTVolumeNotice0">
                  <g fill="none" stroke="#fff" strokeWidth="4">
                    <path
                      fill="#555"
                      strokeLinejoin="round"
                      d="M24 6v36c-7 0-12.201-9.16-12.201-9.16H6a2 2 0 0 1-2-2V17.01a2 2 0 0 1 2-2h5.799S17 6 24 6Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M32 15a11.91 11.91 0 0 1 1.684 1.859A12.07 12.07 0 0 1 36 24c0 2.654-.846 5.107-2.278 7.09A11.936 11.936 0 0 1 32 33"
                    />
                    <path
                      strokeLinecap="round"
                      d="M34.236 41.186C40.084 37.696 44 31.305 44 24c0-7.192-3.796-13.496-9.493-17.02"
                    />
                  </g>
                </mask>
              </defs>
              <path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipTVolumeNotice0)" />
            </svg>
          )}
        </button>

        {/* Expandable Slider Container with Custom Track & Real-time Fill */}
        <div className="relative flex flex-1 items-center min-w-[100px] h-4">
          {/* Background rail */}
          <div className="absolute left-0 right-0 h-1 rounded-full bg-white/20" />
          {/* Filled active track */}
          <div
            className="absolute left-0 h-1 rounded-full bg-white"
            style={{ width: `${currentVolumePercent}%` }}
          />
          {/* Native HTML Range Input for perfect cross-device scrubbing */}
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={currentVolumePercent}
            onChange={handleVolumeChange}
            className="relative z-10 w-full opacity-0 cursor-pointer h-4"
            aria-label="Volume Slider"
          />
          {/* Custom thumb indicator */}
          <div
            className="pointer-events-none absolute h-2.5 w-2.5 -ml-1.5 rounded-full bg-white shadow-md"
            style={{ left: `${currentVolumePercent}%` }}
          />
        </div>
      </div>

      {/* Main Profile Page Content */}
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center p-[50px_15px] box-border">
        <div className="relative z-10 flex w-full max-w-[40rem] flex-col items-center gap-[15px]">
          {/* Profile Card Container (Exact guns.lol frosted glass background: rgba(27, 27, 27, 0.5), no harsh border) */}
          <div className="relative w-full rounded-[20px] bg-[rgba(27,27,27,0.5)] p-[35px_15px] pb-[52px] backdrop-blur-[10px] border-0 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="flex w-full flex-col items-center">
              {/* Perfectly Proportioned Avatar & Wings Frame with OMAR33 circular logo */}
              <div className="relative flex items-center justify-center mt-3 mb-6">
                <div className="relative w-[124px] h-[124px] flex items-center justify-center">
                  {/* OMAR33 Circular Profile Logo */}
                  <img
                    src="/assets/omar33_logo.webp"
                    alt="OMAR33 Logo"
                    className="w-[120px] h-[120px] rounded-full object-cover select-none shadow-2xl relative z-10"
                  />
                  {/* Wings Decoration — perfectly positioned around the logo */}
                  <img
                    src="/assets/avatar_decoration_wings.webp"
                    alt="Wings Decoration"
                    className="pointer-events-none absolute w-[148px] h-[148px] -top-[14px] -left-[12px] z-20 max-w-none select-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]"
                  />
                </div>
              </div>

              {/* Display Name and Subtitle: OMAR33 */}
              <div className="mt-[2px] flex max-w-[27rem] flex-col items-center justify-center text-center">
                {/* Name: OMAR33 with Sparkle Yellow Effect & Glow */}
                <div
                  className="relative inline-flex items-center justify-center cursor-default group/uid"
                  onMouseEnter={() => setShowUidTooltip(true)}
                  onMouseLeave={() => setShowUidTooltip(false)}
                >
                  <h1 className="sparkle-username m-0 text-[39.5px] font-[600] text-white tracking-wide">
                    OMAR33
                  </h1>

                  {/* Tooltip: UID 737098561098874941 */}
                  <div
                    className={`guns-tooltip ${
                      showUidTooltip ? '!opacity-100 !scale-100 !translate-y-0' : ''
                    }`}
                    style={{
                      borderColor: 'rgba(26, 26, 26, 0.4)',
                      backgroundColor: 'rgba(20, 20, 20, 0.85)',
                    }}
                  >
                    UID 737098561098874941
                  </div>
                </div>

                {/* Subtitle / Description */}
                <h3 className="m-0 mt-[5px] text-[19px] font-[570] text-white/90">
                  33
                </h3>
              </div>

              {/* Connected Discord Profile Box (Connected to user: OMAR丶33 - 10mar1 - 737098561098874941) */}
              <div className="mt-[20px] flex w-full max-w-[28rem] justify-center">
                <a
                  href="https://discord.com/users/737098561098874941"
                  target="_blank"
                  rel="noreferrer"
                  className="group/discord flex w-full items-center gap-3.5 rounded-[22px] border-2 border-[rgba(27,27,27,0.1)] bg-[rgba(27,27,27,0.2)] p-3 px-4 backdrop-blur-md transition-all duration-300 hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(27,27,27,0.35)]"
                >
                  {/* Discord Avatar with status ring */}
                  <div className="relative">
                    <img
                      src="/assets/omar_discord_avatar.webp"
                      alt="Discord Avatar"
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    {/* Status ring at bottom right */}
                    <div
                      className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#1b1b1b] bg-[#23a55a]"
                      title="Online"
                    />
                  </div>

                  {/* User info */}
                  <div className="flex flex-1 flex-col justify-center text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] font-bold text-white group-hover/discord:text-[#e2b309] transition-colors">
                        OMAR丶33
                      </span>

                      {/* Clan tag: ⚡ MENA */}
                      <span className="flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-xs font-bold text-white">
                        <span className="text-yellow-400">⚡</span> MENA
                      </span>

                      {/* Nitro Badge */}
                      <span className="flex items-center rounded bg-[#5865f2]/30 px-1.5 py-0.5 text-[10px] font-semibold text-[#5865f2]">
                        NITRO
                      </span>
                    </div>

                    {/* Subtext: @10mar1 • Online */}
                    <span className="text-[12.5px] text-white/60">
                      @10mar1 • <span className="text-[#23a55a]">Online</span>
                    </span>
                  </div>
                </a>
              </div>

              {/* Social Links Row: Discord, TikTok, and YouTube (in place of GitHub) */}
              <div className="mt-[28px] flex w-full flex-wrap items-center justify-center gap-[18px]">
                {/* 1. Discord Link (https://discord.com/users/737098561098874941) */}
                <div className="flex">
                  <a
                    href="https://discord.com/users/737098561098874941"
                    target="_blank"
                    rel="nofollow ugc noopener noreferrer"
                    className="flex transition-transform duration-300 hover:scale-110"
                    title="Discord (@10mar1)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="1.96 4.26 20.03 15.53"
                      className="text-[35px] text-[#e2b309]"
                      style={{ filter: 'drop-shadow(#e2b309 1px 0 7px)' }}
                    >
                      <path
                        fill="currentColor"
                        d="M14.82 4.26a10.14 10.14 0 0 0-.53 1.1a14.66 14.66 0 0 0-4.58 0a10.14 10.14 0 0 0-.53-1.1a16 16 0 0 0-4.13 1.3a17.33 17.33 0 0 0-3 11.59a16.6 16.6 0 0 0 5.07 2.59A12.89 12.89 0 0 0 8.23 18a9.65 9.65 0 0 1-1.71-.83a3.39 3.39 0 0 0 .42-.33a11.66 11.66 0 0 0 10.12 0q.21.18.42.33a10.84 10.84 0 0 1-1.71.84a12.41 12.41 0 0 0 1.08 1.78a16.44 16.44 0 0 0 5.06-2.59a17.22 17.22 0 0 0-3-11.59a16.09 16.09 0 0 0-4.09-1.35zM8.68 14.81a1.94 1.94 0 0 1-1.8-2a1.93 1.93 0 0 1 1.8-2a1.93 1.93 0 0 1 1.8 2a1.93 1.93 0 0 1-1.8 2zm6.64 0a1.94 1.94 0 0 1-1.8-2a1.93 1.93 0 0 1 1.8-2a1.92 1.92 0 0 1 1.8 2a1.92 1.92 0 0 1-1.8 2z"
                      />
                    </svg>
                  </a>
                </div>

                {/* 2. TikTok Link (https://www.tiktok.com/@omargaming_33?_r=1&_t=ZS-9AhLHudvEpQ) */}
                <div className="flex">
                  <a
                    href="https://www.tiktok.com/@omargaming_33?_r=1&_t=ZS-9AhLHudvEpQ"
                    target="_blank"
                    rel="nofollow ugc noopener noreferrer"
                    className="flex transition-transform duration-300 hover:scale-110"
                    title="TikTok (@omargaming_33)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="3.2 2 17.43 19.99"
                      className="text-[35px] text-[#e2b309]"
                      style={{ filter: 'drop-shadow(#e2b309 1px 0 7px)' }}
                    >
                      <path
                        fill="currentColor"
                        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74a2.89 2.89 0 0 1 2.31-4.64a2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                      />
                    </svg>
                  </a>
                </div>

                {/* 3. YouTube Link (https://youtube.com/@iamomar33?si=xZM0vlCk132gNXeB) */}
                <div className="flex">
                  <a
                    href="https://youtube.com/@iamomar33?si=xZM0vlCk132gNXeB"
                    target="_blank"
                    rel="nofollow ugc noopener noreferrer"
                    className="flex transition-transform duration-300 hover:scale-110"
                    title="YouTube (@iamomar33)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                      className="text-[35px] text-[#e2b309]"
                      style={{ filter: 'drop-shadow(#e2b309 1px 0 7px)' }}
                    >
                      <path
                        fill="currentColor"
                        d="m10 15l5.19-3L10 9zm11.56-7.83c.13.47.22 1.1.28 1.9c.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83c-.25.9-.83 1.48-1.73 1.73c-.47.13-1.33.22-2.65.28c-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44c-.9-.25-1.48-.83-1.73-1.73c-.13-.47-.22-1.1-.28-1.9c-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83c.25-.9.83-1.48 1.73-1.73c.47-.13 1.33-.22 2.65-.28c1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44c.9.25 1.48.83 1.73 1.73"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Profile Views Counter (bottom-left inside container, increments on every visitor/entry) */}
            <div className="absolute bottom-[14px] left-[18px] z-20">
              <div
                className="relative inline-flex items-center justify-center cursor-default group/views"
                onMouseEnter={() => setShowViewsTooltip(true)}
                onMouseLeave={() => setShowViewsTooltip(false)}
              >
                <div className="flex items-center text-white/80 hover:text-white transition-colors">
                  <span className="flex items-center text-[14.5px] font-[550] tracking-wide">
                    {/* Eye SVG */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1.15em"
                      height="1.15em"
                      viewBox="0 0 24 24"
                      className="mr-[6px] text-[18px] text-white/70"
                    >
                      <path
                        fill="currentColor"
                        d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"
                      />
                    </svg>
                    {views}
                  </span>
                </div>

                {/* Tooltip: Profile Views */}
                <div
                  className={`guns-tooltip ${
                    showViewsTooltip ? '!opacity-100 !scale-100 !translate-y-0' : ''
                  }`}
                  style={{
                    borderColor: 'rgba(26, 26, 26, 0.4)',
                    backgroundColor: 'rgba(20, 20, 20, 0.85)',
                  }}
                >
                  Profile Views
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
