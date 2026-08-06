import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleChat, closeChat, addMessage, clearChat } from '../utils/Redux/aiChatSlice';
import { fetchAiResponse } from '../utils/geminiService';
import useReducedMotion from '../utils/useReducedMotion';
import { useNavigate } from 'react-router-dom';
import { ITEM_IMG_CDN_URL } from '../utils/constants';
import { FaTimes, FaPaperPlane, FaExpandAlt, FaCompressAlt, FaRegEdit } from 'react-icons/fa';
import { IoFastFood } from 'react-icons/io5';

// --- layout constants -------------------------------------------------
const DEFAULT_SIZE = { width: 400, height: 620 };
const MIN_WIDTH = 320;
const MIN_HEIGHT = 420;
const MOBILE_BREAKPOINT = 640; // matches Tailwind's `sm`
const EDGE_MARGIN = 32; // keep clear of viewport edges
const TOP_CLEARANCE = 110; // keep clear of the navbar/header at the top
const LAUNCHER_FALLBACK_OFFSET = 20; // used if no footer is found on the page
const LAUNCHER_FOOTER_GAP = 16; // breathing room between the launcher and the footer
// Industry-standard FAB cap: the button never goes higher than this from the
// viewport bottom, even when the full footer is in view. This matches Swiggy /
// Zomato behaviour — the button floats above the footer's bottom strip but does
// not ride up the multi-row content area. 80px clears the copyright bar.
const LAUNCHER_MAX_OFFSET = 80;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const pick = (options) => options[Math.floor(Math.random() * options.length)];

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
  const launcherRef = useRef(null);
  const panelRef = useRef(null);

  // `handleSend` reads the transcript, but must not be re-created every time a
  // message lands (it's called from the form, from chips, and from retry). A
  // ref keeps it reading the latest value without making the messages array a
  // dependency, and avoids the stale-closure bug where a chip tapped after
  // several turns would send the history as it stood when it was rendered.
  const historyRef = useRef(messages);
  useEffect(() => {
    historyRef.current = messages;
  }, [messages]);

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
  // Shared hook rather than a second inline matchMedia listener — this file had
  // its own duplicate of the exact logic in utils/useReducedMotion.
  const reducedMotion = useReducedMotion();

  // How far above the viewport bottom the closed-state launcher sits. Previously
  // this was a small fixed offset (20-24px), which put the button right on top
  // of the footer whenever it was in view (e.g. on short pages, or scrolled to
  // the bottom) — 20px isn't enough clearance for a ~50-90px tall footer.
  // Measuring the footer's actual height means this stays correct even if the
  // footer's content changes later (extra row, different breakpoint, etc.)
  // instead of needing another hand-tuned guess.
  const [launcherBottomOffset, setLauncherBottomOffset] = useState(LAUNCHER_FALLBACK_OFFSET);

  useEffect(() => {
    const footerEl = document.getElementById('app-footer');
    if (!footerEl) return;

    // Only the portion of the footer that's actually visible in the viewport
    // matters for the fixed-position launcher. Using the footer's full rendered
    // height (the old approach) caused the button to sit `footer_height + gap`
    // pixels from the viewport bottom at all times — fine for a ~50px footer,
    // but with the multi-column footer (~240px) that placed the button nearly
    // halfway up the screen. The intrusion is 0 when the footer is fully below
    // the fold, so the button stays at LAUNCHER_FALLBACK_OFFSET until the user
    // scrolls far enough for the footer to appear.
    const updateOffset = () => {
      const footerTop = footerEl.getBoundingClientRect().top;
      const intrusion = Math.max(0, window.innerHeight - footerTop);
      const raw = intrusion > 0 ? intrusion + LAUNCHER_FOOTER_GAP : LAUNCHER_FALLBACK_OFFSET;
      setLauncherBottomOffset(Math.min(raw, LAUNCHER_MAX_OFFSET));
    };
    updateOffset();

    // Scroll is the primary trigger — the intrusion changes as the user scrolls
    // toward the footer. Resize and ResizeObserver handle viewport/footer-size
    // changes.
    window.addEventListener('scroll', updateOffset, { passive: true });
    window.addEventListener('resize', updateOffset);
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateOffset);
      ro.observe(footerEl);
    }
    return () => {
      window.removeEventListener('scroll', updateOffset);
      window.removeEventListener('resize', updateOffset);
      if (ro) ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const viewportMql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onViewportChange = (e) => setIsMobileViewport(e.matches);
    viewportMql.addEventListener('change', onViewportChange);
    return () => viewportMql.removeEventListener('change', onViewportChange);
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

  // Escape closes the panel and focus returns to the launcher. Without this the
  // dialog could only be dismissed by clicking its X, and closing it dropped
  // focus back to <body>, stranding keyboard users at the top of the page.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') dispatch(toggleChat());
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, dispatch]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !isOpen) launcherRef.current?.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);

  // Lock background scroll while the mobile bottom-sheet is open.
  useEffect(() => {
    if (isMobileViewport && shouldRender) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [isMobileViewport, shouldRender]);

  /*
   * Trap Tab inside the sheet on mobile only.
   *
   * On mobile this is a true modal: it covers the viewport and the effect above
   * locks body scroll, so Tab used to walk focus into the header and page behind
   * it — links the user could focus, hear announced and activate while unable to
   * see or scroll to them. Desktop is deliberately left untrapped: there the
   * panel is a bounded float with no backdrop and the page stays fully usable,
   * so reaching the rest of the page by keyboard is correct behaviour rather
   * than a bug. That difference is also why `aria-modal` below is conditional.
   */
  useEffect(() => {
    if (!isMobileViewport || !isOpen) return;

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;

      // Queried per keypress, not cached: the header's "new chat" button and the
      // follow-up chips mount and unmount as the conversation progresses, so a
      // list captured on open goes stale within a turn.
      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileViewport, isOpen]);

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

  const handleSend = async (overrideText) => {
    const userText = (overrideText ?? input).trim();
    if (!userText || isLoading) return;
    setInput('');

    // The client-side "banned words" gate that used to live here was a second,
    // drifting copy of the same list in geminiService, and it short-circuited
    // before the message was ever added to the transcript — so an off-topic
    // message produced a reply with no visible question above it, which read as
    // the assistant talking to itself. The service owns topic filtering now,
    // and it can make that call with the conversation in view (a follow-up like
    // "something lighter" is on-topic mid-conversation but has no food word in
    // it, which the naive keyword gate rejected outright).
    // Snapshot the transcript *before* dispatching, so it holds only the turns
    // preceding this message — the new one is passed separately as the current
    // query, and sending it twice would have the model answering an echo.
    // Read synchronously here rather than after the await, because the dispatch
    // below schedules a re-render that updates the ref.
    const priorHistory = historyRef.current;

    dispatch(addMessage({ role: 'user', content: userText, type: 'text' }));
    setIsLoading(true);

    try {
      const aiData = await fetchAiResponse(userText, priorHistory);
      dispatch(
        addMessage({
          role: 'assistant',
          content: aiData.reply,
          type: 'text',
          // Chips ride on the message so they disappear naturally once the
          // next turn arrives, rather than living in separate state that has
          // to be cleared in lockstep.
          followUps: aiData.dishes?.length ? undefined : aiData.followUps,
        })
      );
      if (aiData.dishes && aiData.dishes.length > 0) {
        dispatch(
          addMessage({
            role: 'assistant',
            content: aiData.dishes,
            type: 'dishes',
            followUps: aiData.followUps,
          })
        );
      }
    } catch (error) {
      /*
       * `transient` marks this as a client-side apology, not something the model
       * said. Without the flag it was indistinguishable from a real reply: it
       * was written to localStorage and replayed to the model on the next turn
       * as genuine assistant history, so the model saw itself "saying" it had
       * failed and would sometimes apologise again for a request that had in
       * fact succeeded.
       */
      dispatch(
        addMessage({
          role: 'assistant',
          content: pick(ERROR_CLIENT_REPLIES),
          type: 'text',
          transient: true,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Picking a dish is a completed request: the answer is now the menu page, not
   * the conversation. The panel is anchored bottom-right — exactly where the
   * menu's ADD buttons live — so leaving it open covered the one control the
   * user had just been sent there to press. Closing hands the page back to
   * them; the launcher stays put so the conversation is one click away, and the
   * transcript survives in Redux + localStorage.
   */
  const handleDishClick = (resId, dishId) => {
    dispatch(closeChat());
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
          ref={launcherRef}
          onClick={() => dispatch(toggleChat())}
          aria-label="Open CraveAI Assistant"
          style={{ bottom: launcherBottomOffset }}
          className="group fixed right-5 z-40 flex items-center gap-2.5 rounded-full bg-stone-900 py-3.5 pl-3.5 pr-5 text-white shadow-[0_10px_30px_-8px_rgba(28,25,23,0.55)] transition-[transform,box-shadow,bottom] duration-300 ease-out hover:scale-105 hover:shadow-[0_14px_36px_-8px_rgba(28,25,23,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-crave focus-visible:ring-offset-2 active:scale-95 sm:right-6"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-crave text-stone-900">
            <IoFastFood className="h-4 w-4" />
            {!reducedMotion && (
              <span className="absolute inset-0 rounded-full bg-crave opacity-75 [animation:ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] group-hover:hidden" />
            )}
          </span>
          <span className="text-sm font-bold tracking-wide">Crave AI</span>
        </button>
      )}

      {shouldRender && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="CraveAI Assistant chat"
          // Only the mobile sheet is modal; see the focus-trap effect above.
          aria-modal={isMobileViewport ? 'true' : undefined}
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
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crave text-stone-900">
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
              {/* Now that context carries across turns, the user needs a way to
                  drop it. Without this, an assistant that correctly remembers
                  "veg only" from ten minutes ago has no off switch, and the
                  only escape is clearing site data. */}
              {messages.length > 1 && (
                <button
                  onClick={() => {
                    dispatch(clearChat());
                    inputRef.current?.focus();
                  }}
                  aria-label="Start a new conversation"
                  title="New chat"
                  className="rounded-full p-2 text-stone-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-crave"
                >
                  <FaRegEdit className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              {!isMobileViewport && (
                <button
                  onClick={toggleMaximize}
                  aria-label={isMaximized ? 'Restore size' : 'Expand'}
                  className="rounded-full p-2 text-stone-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-crave"
                >
                  {isMaximized ? <FaCompressAlt className="h-3.5 w-3.5" /> : <FaExpandAlt className="h-3.5 w-3.5" />}
                </button>
              )}
              <button
                onClick={() => dispatch(toggleChat())}
                aria-label="Close chat"
                className="rounded-full p-2 text-stone-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-crave"
              >
                <FaTimes className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div
            className="flex flex-1 flex-col gap-3 overflow-y-auto bg-stone-50 px-4 py-4"
            // Assistant replies arrive asynchronously; without a live region a
            // screen-reader user got no indication an answer had appeared.
            aria-live="polite"
            aria-atomic="false"
          >
            {messages.map((msg, idx) => {
              // Consecutive messages from the same speaker are visually grouped:
              // only the first of a run gets the "tail" corner and only the last
              // carries follow-up chips. Without this, an assistant turn that
              // returns both a sentence and a dish carousel rendered as two
              // disconnected bubbles with matching tails, which read as two
              // separate replies rather than one.
              const prev = messages[idx - 1];
              const startsRun = !prev || prev.role !== msg.role;
              const isUser = msg.role === 'user';
              const followUps = msg.followUps || [];

              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'text' ? (
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? `bg-stone-900 text-white ${startsRun ? 'rounded-tr-sm' : ''}`
                          : `border border-stone-200 bg-white text-stone-800 shadow-sm ${startsRun ? 'rounded-tl-sm' : ''}`
                      }`}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <div className="mt-1 flex w-full flex-col gap-2">
                      {msg.content.map((dish) => (
                        // A real <button>: these were `div onClick` cards, so the
                        // AI's dish suggestions — the entire payoff of the
                        // feature — could not be activated by keyboard at all.
                        <button
                          type="button"
                          key={`${dish.resId}-${dish.id}`}
                          onClick={() => handleDishClick(dish.resId, dish.id)}
                          className="group flex w-full gap-3 rounded-2xl border border-stone-200 bg-white p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-crave hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-crave focus-visible:ring-offset-2"
                        >
                          {dish.imageId ? (
                            <img src={ITEM_IMG_CDN_URL + dish.imageId} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                          ) : (
                            <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-crave-tint text-2xl">🍽️</div>
                          )}
                          <div className="flex min-w-0 flex-col justify-center">
                            <p className="truncate text-sm font-bold text-stone-800">{dish.name}</p>
                            <p className="truncate text-xs text-stone-500">{dish.restaurant}</p>
                            {dish.category && <p className="truncate text-xs text-stone-400">{dish.category}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggested next turns, phrased in the user's voice. These are
                      what turn a dead-end answer into a conversation: they show
                      that refining is possible and give a one-tap way to do it,
                      instead of leaving the user to guess what the assistant can
                      still help with. Hidden while a reply is in flight so a
                      second request can't be queued mid-turn. */}
                  {followUps.length > 0 && !isLoading && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {followUps.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSend(suggestion)}
                          className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-crave focus-visible:ring-offset-2"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-sm border border-stone-200 bg-white px-3.5 py-3 shadow-sm">
                <span className="sr-only">CraveAI is thinking</span>
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex shrink-0 items-center gap-2 border-t border-stone-100 bg-white p-3"
          >
            <label htmlFor="cravai-input" className="sr-only">
              Describe your perfect dish
            </label>
            <input
              id="cravai-input"
              ref={inputRef}
              type="text"
              className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 outline-none transition-colors focus:border-crave focus:bg-white focus:ring-2 focus:ring-crave/30"
              placeholder="Describe your perfect dish…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white transition-all hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-crave focus-visible:ring-offset-2 active:scale-95 disabled:opacity-40 disabled:hover:bg-stone-900"
            >
              <FaPaperPlane className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default CraveAIAssistant;
