"use client";

import { createContext, useContext, useState, useCallback } from "react";

type SearchSheetContextValue = {
  isSearchSheetOpen: boolean;
  setSearchSheetOpen: (open: boolean) => void;
};

const SearchSheetContext = createContext<SearchSheetContextValue | null>(null);

export function SearchSheetOpenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const setSearchSheetOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);
  return (
    <SearchSheetContext.Provider
      value={{ isSearchSheetOpen: isOpen, setSearchSheetOpen }}
    >
      {children}
    </SearchSheetContext.Provider>
  );
}

export function useSearchSheetOpen(): SearchSheetContextValue {
  const ctx = useContext(SearchSheetContext);
  if (!ctx) {
    return {
      isSearchSheetOpen: false,
      setSearchSheetOpen: () => {},
    };
  }
  return ctx;
}
