export default function CartSkeleton() {
  return (
    <div className='container animate-pulse'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='h-4 w-40 bg-gray-200 rounded' />
        <div className='h-9 w-28 bg-gray-200 rounded-md' />
      </div>

      <div className='grid lg:grid-cols-3 gap-8'>
        {/* Left: Cart Items */}
        <div className='lg:col-span-2 space-y-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='rounded-2xl border bg-white shadow-sm p-4'>
              <div className='flex gap-4'>
                {/* Image */}
                <div className='w-32 h-32 rounded-lg bg-gray-200 shrink-0' />

                {/* Info */}
                <div className='flex-1 flex flex-col justify-between'>
                  <div className='space-y-2'>
                    <div className='h-4 w-3/4 bg-gray-200 rounded' />
                    <div className='h-4 w-24 bg-gray-200 rounded' />
                  </div>

                  {/* Quantity controls */}
                  <div className='flex items-center gap-5 mt-4'>
                    <div className='flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2'>
                      <div className='w-6 h-6 bg-gray-200 rounded-full' />
                      <div className='w-4 h-4 bg-gray-200 rounded' />
                      <div className='w-6 h-6 bg-gray-200 rounded-full' />
                    </div>
                    <div className='w-8 h-8 bg-gray-200 rounded' />
                  </div>
                </div>

                {/* Subtotal */}
                <div className='flex flex-col items-end justify-between'>
                  <div className='space-y-2 text-right'>
                    <div className='h-3 w-16 bg-gray-200 rounded ml-auto' />
                    <div className='h-4 w-20 bg-gray-200 rounded ml-auto' />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary */}
        <div className='lg:col-span-1'>
          <div className='sticky top-20 rounded-2xl border bg-white p-6 space-y-6'>
            {/* Title */}
            <div className='h-4 w-32 bg-gray-200 rounded' />

            {/* Summary rows */}
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex justify-between'>
                  <div className='h-3 w-20 bg-gray-200 rounded' />
                  <div className='h-3 w-16 bg-gray-200 rounded' />
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className='h-px bg-gray-200' />

            {/* Total */}
            <div className='flex justify-between items-center'>
              <div className='h-4 w-20 bg-gray-200 rounded' />
              <div className='h-5 w-24 bg-gray-200 rounded' />
            </div>

            {/* Info banner */}
            <div className='h-12 bg-gray-200 rounded-lg' />

            {/* Buttons */}
            <div className='space-y-4 pt-2'>
              <div className='h-10 bg-gray-200 rounded-md' />
              <div className='h-10 bg-gray-200 rounded-md' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
