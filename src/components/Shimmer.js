const ShimmerCard = () => {
    return (
        <div className="m-6 w-[280px] rounded-lg bg-gray-200">
            <div className="relative h-40">
            <div className="absolute bottom-0 left-0 p-2 text-white text-2xl font-extrabold bg-gray-400 w-full h-12"></div>
            <div className="w-full h-40 bg-gray-400 rounded-lg mb-0"></div>
            </div>
            <div className="p-2 mx-2">
            <div className="font-bold text-xl mb-1 bg-gray-400 h-6 w-3/4"></div>
            <div className="flex items-center mb-1 font-bold">
                <div className="text-red-800 mr-1 text-2xl bg-gray-400 h-6 w-6"></div>
                <div className="text-lg bg-gray-400 h-6 w-10"></div>
                <div className="text-lg line-clamp-1 bg-gray-400 h-6"></div>
            </div>
            <div className="text-sm text-gray-500 mb-2 line-clamp-1 bg-gray-400 h-6"></div>
            <div className="text-sm font-bold mb-2 bg-gray-400 h-6 w-1/2"></div>
            </div>
        </div>
    )
}
const ShimmerSearchBar = () => (
    <div className="filter flex">
  <div className="m-4 p-4 relative">
    <input 
      type="text" 
      className="border border-solid rounded-lg py-1 px-4 placeholder-gray-900 animate-pulse"
    />
    <button 
      className="px-3 py-2 m-2 h-9 w-16  bg-green-500 rounded-lg mr-6 animate-pulse"
    >
    </button>
    <button 
      className="px-3 py-2 m-2 h-9 w-52 bg-green-500 rounded-lg animate-pulse"
    >
    </button>
  </div>
</div>

  );
  

const Shimmer = () => {
    return (
        <div className="mx-40">
            <ShimmerSearchBar />
            <div className="flex flex-wrap">
                {[...Array(20)].map((_, index) => (
                    <ShimmerCard key={index} />
                ))}
            </div>
        </div>
    )
}

export default Shimmer;
