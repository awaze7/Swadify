import { useState, useEffect } from 'react';
import { GITHUB_URL } from '../utils/constants';

const User = () => {
  /*
   * Starts empty rather than pre-filled with "Swadify Developer" / "Food
   * Paradise". Those were invented stand-ins rendered inside a first-person
   * sentence, so a failed or slow GitHub request left the card stating a name
   * and a place that don't exist as if they had loaded successfully — worse
   * than saying nothing. The sentence below now adapts to whichever fields
   * actually arrived.
   */
  const [userInfo, setUserInfo] = useState({
    name: '',
    location: '',
    avatar_url: '',
  });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch(GITHUB_URL);
        if (!response.ok) return;
        const json = await response.json();
        if (cancelled) return;
        // Merged, not replaced: GitHub omits `name`/`location` on profiles that
        // haven't set them, and replacing wholesale would reintroduce undefined
        // holes in the sentence.
        setUserInfo((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.entries(json).filter(([, v]) => v != null)),
        }));
      } catch {
        // Non-critical: the card reads correctly without the GitHub fields.
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const { name, location, avatar_url } = userInfo;

  return (
    // `flex-column` is a Bootstrap class name and does nothing in Tailwind, so
    // the `items-center justify-between` beside it were also inert (no flex
    // container). Dropped rather than translated: this card is a plain vertical
    // stack and reads correctly in normal flow.
    <div className="user-card rounded-lg bg-gray-800 p-3 text-white shadow-md">
      <div className="mb-4 flex items-center">
        {avatar_url && (
          // Rendered only once the GitHub avatar has resolved — the initial
          // state has an empty src, which browsers request as the current page
          // and then show as a broken image.
          <img
            className="mr-4 h-20 w-20 rounded-full border-2 border-gray-700 object-cover"
            src={avatar_url}
            alt=""
          />
        )}
        <div className="text-sm mb-2">
          <h2 className="mb-1">
            {name ? (
              <>
                I am <span className="font-medium">{name}</span>, a BE student from
                Sinhgad College of Engineering
              </>
            ) : (
              <>I am a BE student from Sinhgad College of Engineering</>
            )}
            {location ? `, ${location}` : ''}.
          </h2>
          <p className="mb-1">You can reach me at <span className='font-medium'>awazeshaikh7@gmail.com</span>.</p>
        </div>
      </div>

      <div className="text-sm">
        <p>
            I'm the developer behind Swadify, your ultimate food exploration platform.
        </p>
        <p className="mb-4">
          I'm a passionate computer engineer dedicated to creating delightful experiences for food enthusiasts.
          Feel free to reach out and share your thoughts!
        </p>
      </div>
    </div>

  );
};

export default User;
