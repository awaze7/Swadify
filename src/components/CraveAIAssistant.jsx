import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleChat, addMessage } from '../utils/Redux/aiChatSlice';
import { fetchAiResponse } from '../utils/geminiService';
import { useNavigate } from 'react-router-dom';
import { ITEM_IMG_CDN_URL } from '../utils/constants';
import { FaTimes, FaPaperPlane, FaExpandAlt, FaCompressAlt } from 'react-icons/fa';
import { IoFastFood } from 'react-icons/io5';

// --- layout constants -------------------------------------------------
const DEFAULT_SIZE = { width: 400, height: 620 };
const MIN_WIDTH = 320;
const MIN_HEIGHT = 420;
const MOBILE_BREAKPOINT = 640; // matches Tailwind's `sm`
const EDGE_MARGIN = 32; // keep clear of viewport edges
const TOP_CLEARANCE = 110; // keep clear of the navbar/header at the top

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const pick = (options) => options[Math.floor(Math.random() * options.length)];

const NOT_FOOD_CLIENT_REPLIES = [
  "I'm strictly food-focused — try me with a dish, cuisine, or craving!",
  "That one's outside my menu — what are you in the mood to eat?",
  "Food's my whole world here — give me something to chew on, literally.",
];

const ERROR_CLIENT_REPLIES = [
  "Something went sideways on my end — mind trying that again?",
  "Hit a snag there — give it another shot in a moment?",
];

/**
 * Floating, resizable CraveAI chat widget.
 *
 * Previously this was a fixed w-80 h-full sidebar that slid over the entire
 * viewport (including the navbar) whenever open, and it only had an entry
 * point on the home page (Body.jsx), so there was no way to reopen it from
 * a restaurant page once closed. This version:
 *  - lives entirely in this component (launcher bubble + panel), mounted
 *    globally in AppLayout, so it's reachable from every page
 *  - floats bottom-right as a bounded panel instead of a full-height sidebar,
 *    so it never covers the navbar
 *  - is drag-resizable (pointer + keyboard) and has a maximize/restore toggle
 *  - animates open/close instead of appearing/disappearing instantly
 *  - becomes a bottom sheet on small screens instead of a fixed-size float
 */
const CraveAIAssistant = () => {
  const isOpen = useSelector((store) => store.aiChat.isOpen);
  const messages = useSelector((store) => store.aiChat.messages);
  const dispatch = useDispatch();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Mount/visibility are tracked separately so closing can animate out instead
  // of vanishing instantly (the old `if (!isOpen) return null` gave no chance
  // for a transition to play).
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  const [size, setSize] = useState(DEFAULT_SIZE);
  const [isMaximized, setIsMaximized] = useState(false);
  const preMaximizeSize = useRef(DEFAULT_SIZE);

  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const [reducedMotion, setReducedMotion] = useState(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const viewportMql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const motionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onViewportChange = (e) => setIsMobileViewport(e.matches);
    const onMotionChange = (e) => setReducedMotion(e.matches);
    viewportMql.addEventListener('change', onViewportChange);
    motionMql.addEventListener('change', onMotionChange);
    return () => {
      viewportMql.removeEventListener('change', onViewportChange);
      motionMql.removeEventListener('change', onMotionChange);
    };
  }, []);

  // Open/close choreography.
  useEffect(() => {
    let frame1, frame2, closeTimer;
    if (isOpen) {
      setShouldRender(true);
      frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
      closeTimer = setTimeout(() => setShouldRender(false), reducedMotion ? 0 : 220);
    }
    return () => {
      if (frame1) cancelAnimationFrame(frame1);
      if (frame2) cancelAnimationFrame(frame2);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [isOpen, reducedMotion]);

  // Focus the input once opened, for keyboard users.
  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  // Lock background scroll while the mobile bottom-sheet is open.
  useEffect(() => {
    if (isMobileViewport && shouldRender) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [isMobileViewport, shouldRender]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [messages, isLoading, isVisible, reducedMotion]);

  const getMaxDimensions = () => ({
    maxWidth: Math.min(window.innerWidth - EDGE_MARGIN, 760),
    maxHeight: window.innerHeight - TOP_CLEARANCE,
  });

  const handleResizePointerDown = (e) => {
    if (isMobileViewport) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const onMove = (moveEvent) => {
      // The handle sits at the panel's top-left corner (the panel itself is
      // anchored bottom-right), so dragging up/left grows it and dragging
      // down/right shrinks it.
      const { maxWidth, maxHeight } = getMaxDimensions();
      const deltaX = startX - moveEvent.clientX;
      const deltaY = startY - moveEvent.clientY;
      setSize({
        width: clamp(startWidth + deltaX, MIN_WIDTH, maxWidth),
        height: clamp(startHeight + deltaY, MIN_HEIGHT, maxHeight),
      });
      setIsMaximized(false);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleResizeKeyDown = (e) => {
    if (isMobileViewport) return;
    const step = e.shiftKey ? 40 : 16;
    const { maxWidth, maxHeight } = getMaxDimensions();
    let handled = true;
    switch (e.key) {
      case 'ArrowLeft':
        setSize((prev) => ({ ...prev, width: clamp(prev.width + step, MIN_WIDTH, maxWidth) }));
        break;
      case 'ArrowRight':
        setSize((prev) => ({ ...prev, width: clamp(prev.width - step, MIN_WIDTH, maxWidth) }));
        break;
      case 'ArrowUp':
        setSize((prev) => ({ ...prev, height: clamp(prev.height + step, MIN_HEIGHT, maxHeight) }));
        break;
      case 'ArrowDown':
        setSize((prev) => ({ ...prev, height: clamp(prev.height - step, MIN_HEIGHT, maxHeight) }));
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
      setIsMaximized(false);
    }
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setSize(preMaximizeSize.current);
      setIsMaximized(false);
      return;
    }
    preMaximizeSize.current = size;
    const { maxWidth, maxHeight } = getMaxDimensions();
    setSize({ width: maxWidth, height: maxHeight });
    setIsMaximized(true);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    // Basic client-side validation to avoid non-food queries
    const lower = userText.toLowerCase();
    const banned = ['weather', 'politics', 'bitcoin', 'crypto', 'stock', 'program', 'code', 'movie', 'song', 'lyrics', 'translate'];
    if (userText.length < 2 || banned.some((b) => lower.includes(b))) {
      dispatch(addMessage({ role: 'assistant', content: pick(NOT_FOOD_CLIENT_REPLIES), type: 'text' }));
      return;
    }

    dispatch(addMessage({ role: 'user', content: userText, type: 'text' }));
    setIsLoading(true);

    try {
      const aiData = await fetchAiResponse(userText);
      dispatch(addMessage({ role: 'assistant', content: aiData.reply, type: 'text' }));
      if (aiData.dishes && aiData.dishes.length > 0) {
        dispatch(addMessage({ role: 'assistant', content: aiData.dishes, type: 'dishes' }));
      }
    } catch (error) {
      dispatch(addMessage({ role: 'assistant', content: pick(ERROR_CLIENT_REPLIES), type: 'text' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDishClick = (resId, dishId) => {
    navigate(`/restaurants/${resId}?dishId=${dishId}`);
  };

  const panelStyle = isMobileViewport
    ? undefined
    : {
        width: size.width,
        height: size.height,
        maxWidth: `calc(100vw - ${EDGE_MARGIN}px)`,
        maxHeight: `calc(100vh - ${TOP_CLEARANCE}px)`,
      };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => dispatch(toggleChat())}
          aria-label="Open CraveAI Assistant"
          className="group fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 rounded-full bg-stone-900 pl-3.5 pr-5 py-3.5 text-white shadow-[0_10px_30px_-8px_rgba(28,25,23,0.55)] transition-all duration-200 hover:scale-105 hover:shadow-[0_14px_36px_-8px_rgba(28,25,23,0.6)] active:scale-95"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#FFC72C] text-stone-900">
            <IoFastFood className="h-4 w-4" />
            {!reducedMotion && (
              <span className="absolute inset-0 rounded-full bg-[#FFC72C] opacity-75 [animation:ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] group-hover:hidden" />
            )}
          </span>
          <span className="text-sm font-bold tracking-wide">Crave AI</span>
        </button>
      )}

      {shouldRender && (
        <div
          role="dialog"
          aria-label="CraveAI Assistant chat"
          style={panelStyle}
          className={[
            'fixed z-50 flex flex-col overflow-hidden bg-white shadow-[0_24px_70px_-15px_rgba(28,25,23,0.35)] ring-1 ring-stone-900/5',
            isMobileViewport ? 'inset-x-0 bottom-0 h-[88vh] rounded-t-3xl origin-bottom' : 'bottom-6 right-6 rounded-[28px] origin-bottom-right',
            reducedMotion ? '' : 'transition-all duration-200 ease-out',
            isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3 pointer-events-none',
          ].join(' ')}
        >
          {!isMobileViewport && (
            <div
              onPointerDown={handleResizePointerDown}
              onKeyDown={handleResizeKeyDown}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize chat window. Use arrow keys to resize, hold Shift for larger steps."
              tabIndex={0}
              className="absolute left-1 top-1 z-10 flex h-7 w-7 cursor-nwse-resize touch-none items-center justify-center rounded-full text-stone-400 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
                <path d="M4 20 L20 4 M10 20 L20 10 M16 20 L20 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          )}

          <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-stone-900 to-stone-800 px-4 py-3.5 text-white">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFC72C] text-stone-900">
                <IoFastFood className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold leading-tight">CraveAI</h3>
                <p className="truncate text-[11px] leading-tight text-stone-400">
                  {isLoading ? 'Thinking…' : 'Your food-finding sidekick'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!isMobileViewport && (
                <button
                  onClick={toggleMaximize}
                  aria-label={isMaximized ? 'Restore size' : 'Expand'}
                  className="rounded-full p-2 text-stone-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {isMaximized ? <FaCompressAlt className="h-3.5 w-3.5" /> : <FaExpandAlt className="h-3.5 w-3.5" />}
                </button>
              )}
              <button
                onClick={() => dispatch(toggleChat())}
                aria-label="Close chat"
                className="rounded-full p-2 text-stone-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <FaTimes className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-stone-50 px-4 py-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'text' ? (
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm bg-stone-900 text-white'
                        : 'rounded-tl-sm border border-stone-200 bg-white text-stone-800 shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div className="mt-1 flex w-full flex-col gap-2">
                    {msg.content.map((dish) => (
                      <div
                        key={`${dish.resId}-${dish.id}`}
                        onClick={() => handleDishClick(dish.resId, dish.id)}
                        className="group flex cursor-pointer gap-3 rounded-2xl border border-stone-200 bg-white p-2.5 transition-all hover:-translate-y-0.5 hover:border-[#FFC72C] hover:shadow-md"
                      >
                        {dish.imageId ? (
                          <img src={ITEM_IMG_CDN_URL + dish.imageId} alt={dish.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#FFF6DD] text-2xl">🍽️</div>
                        )}
                        <div className="flex min-w-0 flex-col justify-center">
                          <p className="truncate text-sm font-bold text-stone-800">{dish.name}</p>
                          <p className="truncate text-xs text-stone-500">{dish.restaurant}</p>
                          {dish.category && <p className="truncate text-xs text-stone-400">{dish.category}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-sm border border-stone-200 bg-white px-3.5 py-3 shadow-sm">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-stone-100 bg-white p-3">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 outline-none transition-colors focus:border-[#FFC72C] focus:bg-white focus:ring-2 focus:ring-[#FFC72C]/30"
              placeholder="Describe your perfect dish…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white transition-all hover:bg-black active:scale-95 disabled:opacity-40 disabled:hover:bg-stone-900"
            >
              <FaPaperPlane className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CraveAIAssistant;
