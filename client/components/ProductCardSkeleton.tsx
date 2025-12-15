import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductCardSkeleton() {
  return (
    <Card className='h-full'>
      <CardContent className='p-4'>
        {/* Image skeleton */}
        <Skeleton className='w-full h-40 mb-3 rounded' />

        {/* Title skeleton - 2 lines */}
        <Skeleton className='h-4 w-full mb-1.5' />
        <Skeleton className='h-4 w-3/4 mb-3' />

        {/* Description skeleton - 2 lines */}
        <Skeleton className='h-3 w-full mb-1' />
        <Skeleton className='h-3 w-5/6 mb-3' />

        {/* Price and rating skeleton */}
        <div className='flex items-center justify-between'>
          <Skeleton className='h-6 w-16' />
          <Skeleton className='h-3 w-14' />
        </div>
      </CardContent>

      <CardFooter className='p-4 pt-0'>
        <Skeleton className='h-9 w-full rounded' />
      </CardFooter>
    </Card>
  );
}
