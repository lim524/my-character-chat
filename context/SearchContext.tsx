// context/SearchContext.tsx
import { createContext, useContext, useState } from 'react'

type SearchContextType = {
  searchQuery: string
  setSearchQuery: (q: string) => void
  showSearch: boolean
  toggleSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const toggleSearch = () => setShowSearch(prev => !prev)

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, showSearch, toggleSearch }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useSearch must be used within SearchProvider')
  return context
}
