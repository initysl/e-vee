'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdAddShoppingCart } from 'react-icons/md';
import { CiSquareInfo } from 'react-icons/ci';
import { RiShoppingBag2Line, RiRobot3Line } from 'react-icons/ri';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { getItemCount } = useCart();

  const navItems = [
    {
      name: 'Market',
      href: '/market',
      icon: RiShoppingBag2Line,
      matchPaths: ['/market'],
    },
    {
      name: 'Product',
      href: '/product',
      icon: Package,
      matchPaths: ['/product'],
    },
    { name: 'Info', href: '#', icon: CiSquareInfo, matchPaths: ['/'] },
    {
      name: 'Cart',
      href: '/cart',
      icon: MdAddShoppingCart,
      badge: getItemCount(),
      matchPaths: ['/cart'],
    },
    {
      name: 'E-vee',
      href: '/evee',
      icon: RiRobot3Line,
      matchPaths: ['/evee'],
    },
  ];

  return (
    <nav className='fixed top-4 left-1/2 -translate-x-1/2 z-50'>
      <div className='bg-zinc-700 px-3 py-2 rounded-2xl shadow-xl'>
        <ul className='flex items-center gap-2'>
          {navItems.map((item) => {
            // Check if current path matches this nav item
            const isActive = item.matchPaths.some((path) =>
              pathname.startsWith(path)
            );
            const isHovered = hoveredItem === item.name;
            const showBackground = isActive || isHovered;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`relative flex items-center gap-2 transition-all duration-300 ${
                    showBackground
                      ? 'bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg scale-105'
                      : 'text-white hover:text-zinc-200 p-2'
                  } ${
                    item.name === 'Product'
                      ? 'pointer-events-none opacity-60'
                      : ''
                  }`}
                >
                  <item.icon size={20} className='shrink-0' />
                  {isActive && (
                    <span className='text-sm font-medium hidden sm:flex'>
                      {item.name}
                    </span>
                  )}

                  {/* Cart Badge */}
                  {item.badge && item.badge > 0 ? (
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold'>
                      {item.badge}
                    </span>
                  ) : (
                    ''
                  )}

                  {/* E-vee Active Indicator */}
                  {item.name === 'E-vee' && (
                    <span className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white' />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
