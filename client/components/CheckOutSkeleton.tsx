export default function CheckoutSkeleton() {
  return (
    <div className='container animate-pulse'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2'>
        <div className='h-4 w-44 bg-gray-200 rounded' />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
        {/* Checkout Form */}
        <div className='lg:col-span-2 space-y-4'>
          {/* Contact Information */}
          <div className='rounded-xl border bg-white shadow-sm'>
            <div className='p-4 sm:p-6 space-y-4'>
              <div className='h-4 w-40 bg-gray-200 rounded' />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {[1, 2].map((i) => (
                  <div key={i} className='space-y-2'>
                    <div className='h-3 w-28 bg-gray-200 rounded' />
                    <div className='h-10 bg-gray-200 rounded-md' />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className='rounded-xl border bg-white shadow-sm'>
            <div className='p-4 sm:p-6 space-y-4'>
              <div className='h-4 w-40 bg-gray-200 rounded' />

              <div className='space-y-2'>
                <div className='h-3 w-32 bg-gray-200 rounded' />
                <div className='h-10 bg-gray-200 rounded-md' />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='space-y-2'>
                    <div className='h-3 w-20 bg-gray-200 rounded' />
                    <div className='h-10 bg-gray-200 rounded-md' />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className='rounded-xl border bg-white shadow-sm'>
            <div className='p-4 sm:p-6 space-y-3'>
              <div className='h-4 w-40 bg-gray-200 rounded' />
              <div className='h-10 bg-gray-200 rounded-md' />
              <div className='h-3 w-64 bg-gray-200 rounded' />
            </div>
          </div>

          {/* Error Placeholder */}
          <div className='h-14 bg-gray-200 rounded-lg' />
        </div>

        {/* Order Summary */}
        <div className='lg:col-span-1'>
          <div className='lg:sticky lg:top-20 rounded-xl border bg-white shadow-sm'>
            <div className='p-4 sm:p-6 space-y-4'>
              {/* Title */}
              <div className='h-5 w-40 bg-gray-200 rounded' />

              {/* Items */}
              <div className='space-y-3 max-h-48 overflow-hidden'>
                {[1, 2].map((i) => (
                  <div key={i} className='flex gap-3 items-center'>
                    <div className='w-14 h-14 bg-gray-200 rounded shrink-0' />
                    <div className='flex-1 space-y-2'>
                      <div className='h-3 w-full bg-gray-200 rounded' />
                      <div className='h-3 w-20 bg-gray-200 rounded' />
                    </div>
                    <div className='h-3 w-12 bg-gray-200 rounded' />
                  </div>
                ))}
              </div>

              <div className='h-px bg-gray-200 my-3' />

              {/* Totals */}
              <div className='space-y-2 text-sm'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='flex justify-between'>
                    <div className='h-3 w-24 bg-gray-200 rounded' />
                    <div className='h-3 w-16 bg-gray-200 rounded' />
                  </div>
                ))}
              </div>

              <div className='h-px bg-gray-200 my-3' />

              {/* Total */}
              <div className='flex justify-between items-center'>
                <div className='h-4 w-24 bg-gray-200 rounded' />
                <div className='h-5 w-28 bg-gray-200 rounded' />
              </div>

              {/* CTA */}
              <div className='h-11 bg-gray-200 rounded-md mt-4' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
