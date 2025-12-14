'use client';

import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import Navbar from '@/components/NavBar';

export default function MarketPage() {
  const { products, loading, error } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredProducts, setFilteredProducts] = useState(products);

  // Get unique categories
  const categories = ['all', ...new Set(products.map((p) => p.category))];

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Navbar with filters - only shows on non-home pages */}
      <Navbar
        showFilters={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />

      {/* Add padding top to account for fixed navbar */}
      <div className='pt-24'>
        <div className='container mx-auto px-4'>
          {/* Results count */}
          {!loading && (
            <p className='text-gray-600 mb-4'>
              Showing {filteredProducts.length} of {products.length} products
            </p>
          )}

          {/* Error State */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6'>
              <p className='font-semibold'>Error loading products</p>
              <p className='text-sm'>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className='text-center py-12'>
              <p className='text-gray-500 text-lg'>No products found</p>
              <p className='text-gray-400 text-sm mt-2'>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
