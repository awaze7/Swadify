import React, { useEffect, useRef } from "react";
import { animate, createScope, createTimeline, stagger } from "animejs";
import { IoFastFood } from "react-icons/io5";
import AuthBg from "url:../utils/auth-background.webp";

/**
 * Shared shell for Login/Signup: full-bleed background photo with a glass
 * card floating on top, plus an Anime.js entrance for the card and its
 * fields, and a "shake" reaction for validation/auth errors.
 *
 * Replaces the old side-by-side layout (small Swadify_img.png next to a
 * bare, uncarded form) that both pages used via FormImage.jsx.
 *
 * Usage: wrap the existing <form>/<FormMessage> exactly as before- the
 * fields themselves are untouched, only the surrounding chrome changes.
 * Increment `shakeSignal` (e.g. a counter in the parent's state) whenever
 * you want the card to shake - on failed validation or a rejected login.
 */
const AuthLayout = ({ children, shakeSignal }) => {
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const scopeRef = useRef(null);
  const isFirstShake = useRef(true);

  useEffect(() => {
    scopeRef.current = createScope({
      root: rootRef,
      mediaQueries: { reduceMotion: "(prefers-reduced-motion: reduce)" },
    }).add((self) => {
      const { reduceMotion } = self.matches;
      const fields = rootRef.current.querySelectorAll(".auth-field");

      if (!reduceMotion) {
        createTimeline({ defaults: { ease: "outExpo" } })
          .add(cardRef.current, {
            opacity: [0, 1],
            translateY: [28, 0],
            scale: [0.96, 1],
            duration: 650,
          })
          .add(
            fields,
            { opacity: [0, 1], translateY: [14, 0], duration: 500, delay: stagger(70) },
            "-=380"
          );
      }

      // Registered so it can be triggered later (on validation/auth errors)
      // from outside this effect via scope.methods.shake().
      self.add("shake", () => {
        if (reduceMotion) return;
        animate(cardRef.current, {
          translateX: [0, -10, 10, -8, 8, -4, 4, 0],
          duration: 500,
          ease: "inOut(2)",
        });
      });
    });

    return () => scopeRef.current?.revert();
  }, []);

  useEffect(() => {
    // Skip the run that happens on mount (shakeSignal starts at 0 with
    // nothing wrong yet) - only react to it actually changing afterward.
    if (isFirstShake.current) {
      isFirstShake.current = false;
      return;
    }
    scopeRef.current?.methods?.shake?.();
  }, [shakeSignal]);

  return (
    <div
      ref={rootRef}
      className="relative flex w-full items-center justify-center overflow-hidden px-4 py-12 sm:py-16"
      style={{ minHeight: "max(560px, calc(100vh - 160px))" }}
    >
      <div className="absolute inset-0 -z-10">
        <img src={AuthBg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/85 via-stone-900/60 to-stone-950/90" />
      </div>

      <div
        ref={cardRef}
        className="relative w-full max-w-md rounded-[28px] border border-white/25 bg-white/95 p-7 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-10"
      >
        <div className="auth-field mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crave text-stone-900">
            <IoFastFood className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Swadify</span>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
