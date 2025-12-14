'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdAddShoppingCart } from 'react-icons/md';
import { CiSquareInfo } from 'react-icons/ci';
import { RiShoppingBag2Line } from 'react-icons/ri';
import { RiRobot3Line } from 'react-icons/ri';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: string[];
  showFilters?: boolean;
}

export default function Navbar({
  searchQuery = '',
  onSearchChange,
  selectedCategory = 'all',
  onCategoryChange,
  categories = [],
  showFilters = false,
}: NavbarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Don't render navbar on home page
  if (pathname === '/') return null;

  const navItems = [
    { name: 'Market', href: '/market', icon: RiShoppingBag2Line },
    { name: 'Info', href: '/info', icon: CiSquareInfo },
    { name: 'Cart', href: '/cart', icon: MdAddShoppingCart },
    { name: 'Evee', href: '/chat', icon: RiRobot3Line },
  ];

  return (
    <nav className='fixed top-4 left-1/2 transform -translate-x-1/2 z-50'>
      <div className='backdrop-blur-md px-4'>
        <div className='flex items-center gap-4'>
          {/* Navigation Items */}
          <div className='bg-zinc-700 px-3 py-2 rounded-2xl shadow-lg'>
            <ul className='flex space-x-2 items-center'>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isHovered = hoveredItem === item.name;
                const showBackground = isActive || isHovered;
                const showLabel = isActive;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setHoveredItem(item.name)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`flex gap-2 items-center transition-all duration-300 ease-in-out ${
                        showBackground
                          ? 'bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg scale-105'
                          : 'text-white hover:text-zinc-200 p-2'
                      }`}
                    >
                      <item.icon size={18} />
                      {showLabel && (
                        <span className='text-sm font-medium animate-in fade-in slide-in-from-left-2 duration-200'>
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Search and Filters - Only show if enabled */}
          {showFilters && (
            <>
              {/* Search */}
              <div className='relative flex-1 max-w-md transition-all duration-300 ease-in-out'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none z-10' />
                <Input
                  type='text'
                  placeholder='Search products...'
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className='pl-10 w-full bg-zinc-700 border-zinc-600 text-white placeholder:text-gray-400 focus:ring-blue-500'
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={onCategoryChange}>
                <SelectTrigger className='w-40 shrink-0 bg-zinc-700 border-zinc-600 text-white'>
                  <SelectValue placeholder='All Categories' />
                </SelectTrigger>
                <SelectContent className='bg-zinc-800 border-zinc-700'>
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className='text-white hover:bg-zinc-700'
                    >
                      {category === 'all'
                        ? 'All Categories'
                        : category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
