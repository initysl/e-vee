'use client';

export default function ProductDetailSkeleton() {
  return (
    <div className='container animate-pulse'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-10'>
        {/* Image Skeleton */}
        <div className='relative rounded-2xl overflow-hidden bg-gray-100 h-90 flex items-center justify-center'>
          <div className='w-64 h-64 bg-gray-200 rounded-xl' />
        </div>

        {/* Info Skeleton */}
        <div className='flex flex-col'>
          {/* Title */}
          <div className='h-6 w-3/4 bg-gray-200 rounded' />

          {/* Rating */}
          <div className='flex items-center gap-2 mt-3'>
            <div className='h-4 w-20 bg-gray-200 rounded' />
            <div className='h-3 w-24 bg-gray-200 rounded' />
          </div>

          {/* Price */}
          <div className='h-8 w-32 bg-gray-200 rounded mt-5' />

          {/* Description */}
          <div className='space-y-3 mt-5'>
            <div className='h-4 w-full bg-gray-200 rounded' />
            <div className='h-4 w-full bg-gray-200 rounded' />
            <div className='h-4 w-5/6 bg-gray-200 rounded' />
          </div>

          {/* Actions */}
          <div className='mt-8 flex items-center gap-4'>
            <div className='h-12 w-44 bg-gray-200 rounded-full' />
            <div className='h-12 w-40 bg-gray-200 rounded-md' />
          </div>

          {/* Extras */}
          <div className='mt-10 border-t pt-6 space-y-2'>
            <div className='h-3 w-40 bg-gray-200 rounded' />
            <div className='h-3 w-36 bg-gray-200 rounded' />
            <div className='h-3 w-64 bg-gray-200 rounded' />
          </div>
        </div>
      </div>
    </div>
  );
}
