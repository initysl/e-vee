import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductCardSkeleton() {
  return (
    <Card className='h-full'>
      <CardContent className='p-4'>
        {/* Image skeleton */}
        <Skeleton className='w-full h-48 mb-4' />

        {/* Title skeleton */}
        <Skeleton className='h-6 w-3/4 mb-2' />
        <Skeleton className='h-6 w-1/2 mb-2' />

        {/* Description skeleton */}
        <Skeleton className='h-4 w-full mb-1' />
        <Skeleton className='h-4 w-5/6 mb-4' />

        {/* Price and rating skeleton */}
        <div className='flex items-center justify-between mt-4'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-4 w-16' />
        </div>
      </CardContent>

      <CardFooter className='p-4 pt-0'>
        <Skeleton className='h-10 w-full' />
      </CardFooter>
    </Card>
  );
}
