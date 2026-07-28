import { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance (Default)" },
  { id: "deliveryTime", label: "Delivery Time" },
  { id: "rating", label: "Rating" },
  { id: "costLowToHigh", label: "Cost: Low to High" },
  { id: "costHighToLow", label: "Cost: High to Low" },
];

const SortDropdown = ({ selectedSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState(selectedSort);
  const dropdownRef = useRef(null);

  // Sync state if parent props change
  useEffect(() => {
    setTempSelected(selectedSort);
  }, [selectedSort]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApply = () => {
    onSortChange(tempSelected);
    setIsOpen(false);
  };

  const selectedOptionLabel =
    SORT_OPTIONS.find((opt) => opt.id === selectedSort)?.label || "Sort By";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button matching Swiggy styling */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border shadow-sm ${
          selectedSort !== "relevance"
            ? "border-gray-900 bg-gray-900 text-white"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span>
          {selectedSort === "relevance" ? "Sort By" : selectedOptionLabel}
        </span>
        <FiChevronDown
          className={`text-base transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Swiggy Filter Popover Box */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50 animate-fadeIn">
          <div className="space-y-4">
            {SORT_OPTIONS.map((option) => {
              const isChecked = tempSelected === option.id;
              return (
                <label
                  key={option.id}
                  onClick={() => setTempSelected(option.id)}
                  className="flex items-center justify-between cursor-pointer group py-1"
                >
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isChecked
                        ? "text-gray-900 font-bold"
                        : "text-gray-600 group-hover:text-gray-900"
                    }`}
                  >
                    {option.label}
                  </span>

                  {/* Swiggy Orange Custom Radio Button */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                      isChecked
                        ? "border-[#fc8019] bg-[#fc8019]"
                        : "border-gray-300 group-hover:border-gray-400"
                    }`}
                  >
                    {isChecked && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="w-full mt-6 bg-[#fc8019] hover:bg-[#e26e0e] text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-md active:scale-95"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;