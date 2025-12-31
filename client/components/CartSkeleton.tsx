export default function CartSkeleton() {
  return (
    <div className='container animate-pulse'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='h-4 w-40 bg-gray-200 rounded' />
        <div className='h-9 w-32 bg-gray-200 rounded-md' />
      </div>

      <div className='grid lg:grid-cols-3 gap-8'>
        {/* Cart Items */}
        <div className='lg:col-span-2 space-y-4'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='overflow-hidden rounded-2xl shadow-sm border bg-white'
            >
              <div className='flex flex-col md:flex-row gap-4 p-4'>
                {/* Image */}
                <div className='relative w-full h-40 md:w-32 md:h-32 shrink-0 rounded-lg bg-gray-200' />

                {/* Product Info */}
                <div className='flex flex-col justify-between flex-1'>
                  <div className='space-y-2'>
                    <div className='h-4 w-3/4 bg-gray-200 rounded' />
                    <div className='h-4 w-24 bg-gray-200 rounded' />
                  </div>

                  {/* Quantity + Remove */}
                  <div className='flex items-center justify-between mt-4 md:mt-6'>
                    <div className='flex items-center gap-2 bg-zinc-100 rounded-full px-3 py-1'>
                      <div className='w-8 h-8 bg-gray-200 rounded-full' />
                      <div className='w-6 h-4 bg-gray-200 rounded' />
                      <div className='w-8 h-8 bg-gray-200 rounded-full' />
                    </div>

                    <div className='w-8 h-8 bg-gray-200 rounded-full' />
                  </div>
                </div>

                {/* Subtotal */}
                <div className='flex justify-between items-center md:flex-col md:items-end md:justify-between'>
                  <div className='h-3 w-16 bg-gray-200 rounded md:mb-2' />
                  <div className='h-4 w-20 bg-gray-200 rounded' />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className='lg:col-span-1'>
          <div className='sticky top-20 bg-white border-2 rounded-2xl'>
            <div className='p-6 space-y-6'>
              {/* Title */}
              <div className='h-4 w-32 bg-gray-200 rounded' />

              {/* Rows */}
              <div className='space-y-4'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='flex justify-between'>
                    <div className='h-3 w-24 bg-gray-200 rounded' />
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

              {/* Info Banner */}
              <div className='h-12 bg-gray-200 rounded-lg' />

              {/* Buttons */}
              <div className='flex flex-col gap-5'>
                <div className='h-10 bg-gray-200 rounded-md' />
                <div className='h-10 bg-gray-200 rounded-md' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
