// Mirrors RestaurantCard's real geometry: a fixed h-40 image and p-4 body.
// The skeleton previously used an aspect-[4/3] image and p-3, so every card
// shrank by ~20px the moment real data arrived and the whole grid jumped.
const ShimmerCard = () => {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="h-40 w-full rounded-xl bg-gray-200" />

      <div className="flex flex-col gap-2 p-4">
        <div className="h-5 w-3/4 rounded-md bg-gray-200" />
        <div className="h-4 w-1/2 rounded-md bg-gray-200" />
        <div className="h-3.5 w-full rounded-md bg-gray-200" />
        <div className="h-3.5 w-2/5 rounded-md bg-gray-200" />
      </div>
    </div>
  );
};

// Mirrors RestaurantMenu's real geometry: a max-w-3xl column, a title/rating
// block, then stacked category rows. Previously the menu route rendered the
// home-page <Shimmer /> above — a max-w-7xl 12-card grid with a search bar —
// so the container alone jumped from 1280px to 768px when data landed, and
// screen readers were told "Loading restaurants" on a menu page.
export const MenuShimmer = () => (
  <>
    <span className="sr-only" role="status">
      Loading menu
    </span>
    <div
      className="mx-auto mb-8 mt-3 w-full max-w-3xl animate-pulse px-4 pb-28 sm:px-6 lg:px-0"
      aria-hidden="true"
    >
      <div className="my-4">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="mt-6 h-7 w-3/5 rounded-md bg-gray-200" />
            <div className="mt-2.5 h-4 w-4/5 rounded-md bg-gray-100" />
            <div className="mt-1.5 h-4 w-2/5 rounded-md bg-gray-100" />
          </div>
          <div className="mb-4 mt-6 h-[74px] w-[68px] shrink-0 rounded-lg bg-gray-200" />
        </div>
        <div className="mt-1 h-4 w-1/2 rounded-md bg-gray-100" />
      </div>

      {[0, 1, 2, 3].map((n) => (
        <div key={`menu-shimmer-${n}`} className="mx-3 my-4 border-b-8 border-gray-100 py-2">
          <div className="flex items-center justify-between py-2">
            <div className="h-5 w-2/5 rounded-md bg-gray-200" />
            <div className="h-4 w-4 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  </>
);

// 2. Main Shimmer Layout
const Shimmer = () => {
  return (
    <>
      <span className="sr-only" role="status">
        Loading restaurants
      </span>
      <div
        className="min-h-screen w-full animate-pulse overflow-x-hidden bg-gray-50 pb-12"
        // The whole tree is decorative placeholder geometry; the status message
        // above is what assistive tech should hear instead.
        aria-hidden="true"
      >
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="mb-2">
            <div className="mb-4 h-8 w-64 rounded-md bg-gray-200 md:w-80" />

            <div className="flex gap-6 overflow-hidden pb-4 pt-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={`carousel-shimmer-${n}`}
                  className="h-[135px] w-[200px] shrink-0 rounded-2xl bg-gray-200 sm:h-[150px] sm:w-[220px] md:w-[240px]"
                />
              ))}
            </div>
          </div>

          <hr className="my-6 border-gray-200 shadow-sm" />

          <div className="mb-8">
            <div className="mb-6 h-8 w-72 rounded-md bg-gray-200 md:w-96" />

            <div className="flex flex-wrap items-center gap-4">
              <div className="h-[44px] w-full rounded-full bg-gray-200 md:w-[420px]" />
              <div className="hidden h-[44px] w-[110px] rounded-full bg-gray-200 sm:block" />
              <div className="hidden h-[44px] w-[138px] rounded-full bg-gray-200 sm:block" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(12)].map((_, index) => (
              <ShimmerCard key={`grid-shimmer-${index}`} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Shimmer;