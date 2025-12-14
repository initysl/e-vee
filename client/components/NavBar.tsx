'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdAddShoppingCart } from 'react-icons/md';
import { CiSquareInfo } from 'react-icons/ci';
import { RiShoppingBag2Line, RiRobot3Line } from 'react-icons/ri';
import { Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function Navbar({
  searchQuery = '',
  onSearchChange,
}: NavbarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  const navItems = [
    { name: 'Market', href: '/market', icon: RiShoppingBag2Line },
    { name: 'Info', href: '/info', icon: CiSquareInfo },
    { name: 'Cart', href: '/cart', icon: MdAddShoppingCart },
    { name: 'Evee', href: '/chat', icon: RiRobot3Line },
  ];

  return (
    <nav className='fixed top-2 left-1/2 -translate-x-1/2 z-50'>
      <div className='px-3 py-2'>
        <div className='flex items-center gap-3'>
          {/* Navigation */}
          <div className='bg-zinc-700 w-72 px-2 py-2 rounded-2xl shadow-lg '>
            <ul className='flex items-center space-x-1 sm:space-x-2 '>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isHovered = hoveredItem === item.name;
                const showBackground = isActive || isHovered;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setHoveredItem(item.name)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`flex items-center gap-1 sm:gap-2 transition-all duration-300 ${
                        showBackground
                          ? 'bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-xl shadow-md scale-105'
                          : 'text-white hover:text-zinc-200 p-2'
                      }`}
                    >
                      <item.icon size={18} className='shrink-0' />
                      {isActive && (
                        <span className='text-xs sm:text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200'>
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Expandable Search */}
          <div className='hidden sm:flex items-center'>
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className='flex h-10 w-10 items-center justify-center rounded-md bg-zinc-700 text-white hover:bg-zinc-600'
            >
              <Search size={18} />
            </button>

            {/* Search Input */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                searchOpen ? 'ml-2 w-32' : 'w-0'
              }`}
            >
              <Input
                ref={inputRef}
                type='text'
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder='Search products...'
                className='h-10 bg-zinc-700 text-white placeholder:text-zinc-300 focus:ring-blue-500'
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
