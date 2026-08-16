"use client";

import { useId, useMemo, useState } from "react";

interface SearchFilterBarProps {
  onSearch: (query: string) => void;
  onFilterCategory: (category: string | null) => void;
  categories: string[];
  initialQuery?: string;
  initialCategory?: string | null;
}

export default function SearchFilterBar({
  onSearch,
  onFilterCategory,
  categories,
  initialQuery = "",
  initialCategory = null,
}: SearchFilterBarProps) {
  const [query, setQuery] = useState<string>(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  const searchInputId = useId();

  const allCategories = useMemo(
    () => ["All", ...categories.filter((c) => c !== "All")],
    [categories],
  );

  const handleSearchChange = (value: string): void => {
    setQuery(value);
    onSearch(value);
  };

  const handleCategorySelect = (category: string): void => {
    const normalized = category === "All" ? null : category;
    setActiveCategory(normalized);
    onFilterCategory(normalized);
    setMobileFiltersOpen(false);
  };

  return (
    <div className="w-full border-b border-[#E8E4DD]">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <label htmlFor={searchInputId} className="sr-only">
              Search jerseys
            </label>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8A8680"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              id={searchInputId}
              type="search"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search teams, leagues, kits..."
              className="w-full border border-[#8A8680]/30 bg-transparent py-2.5 pl-10 pr-4 text-sm text-[#0F0F0F] placeholder:text-[#8A8680] focus:border-[#1A1A1A] focus:outline-none"
            />
          </div>

          <div className="hidden md:flex flex-wrap items-center gap-2">
            {allCategories.map((category) => {
              const isActive =
                (category === "All" && activeCategory === null) ||
                category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  aria-pressed={isActive}
                  className={`
                    px-4 py-2 font-heading uppercase tracking-[0.18em] text-[11px]
                    transition-colors duration-200
                    ${
                      isActive
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-transparent text-[#0F0F0F] border border-[#8A8680]/30 hover:border-[#1A1A1A]"
                    }
                  `}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              aria-expanded={mobileFiltersOpen}
              aria-controls="mobile-category-filters"
              className="inline-flex w-full items-center justify-between gap-2 border border-[#8A8680]/30 px-4 py-2.5 font-heading uppercase tracking-[0.18em] text-[11px] text-[#0F0F0F] hover:border-[#1A1A1A] transition-colors"
            >
              <span>
                {activeCategory ? `Filter: ${activeCategory}` : "Filter by Category"}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={`transition-transform duration-200 ${
                  mobileFiltersOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {mobileFiltersOpen && (
              <div
                id="mobile-category-filters"
                className="mt-2 grid grid-cols-2 gap-2 border border-[#E8E4DD] bg-[#F0EDE8] p-3"
              >
                {allCategories.map((category) => {
                  const isActive =
                    (category === "All" && activeCategory === null) ||
                    category === activeCategory;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      aria-pressed={isActive}
                      className={`
                        px-3 py-2 font-heading uppercase tracking-[0.18em] text-[10px]
                        transition-colors duration-200
                        ${
                          isActive
                            ? "bg-[#1A1A1A] text-white"
                            : "bg-white text-[#0F0F0F] border border-[#8A8680]/30 hover:border-[#1A1A1A]"
                        }
                      `}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
