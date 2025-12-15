import { Skeleton } from '@/components/ui/skeleton';

export default function ProductCardSkeleton() {
  return (
    <div className='h-full border-0 bg-gradient-to-br from-white to-gray-50'>
      <div className='p-4'>
        {/* Image skeleton with gradient background */}
        <div className='relative w-full h-48 mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden'>
          <Skeleton className='w-full h-full' />

          {/* Like button skeleton */}
          <div className='absolute top-3 right-3'>
            <Skeleton className='w-10 h-10 rounded-full' />
          </div>

          {/* Category badge skeleton */}
          <div className='absolute bottom-3 left-3'>
            <Skeleton className='h-6 w-20 rounded-full' />
          </div>
        </div>

        {/* Product info skeleton */}
        <div className='space-y-3'>
          {/* Title skeleton */}
          <div className='space-y-1.5'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-4/5' />
          </div>

          {/* Description skeleton */}
          <div className='space-y-1'>
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-3/4' />
          </div>

          {/* Rating skeleton */}
          <Skeleton className='h-4 w-32' />

          {/* Price and button skeleton */}
          <div className='flex items-center justify-between pt-2'>
            <Skeleton className='h-8 w-20' />
            <Skeleton className='h-8 w-20 rounded-full' />
          </div>
        </div>
      </div>
    </div>
  );
}
