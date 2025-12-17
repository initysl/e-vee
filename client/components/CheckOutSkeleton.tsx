export default function CheckoutSkeleton() {
  return (
    <div className='container animate-pulse'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='h-4 w-48 bg-gray-200 rounded' />
      </div>

      <div className='grid lg:grid-cols-3 gap-8'>
        {/* Left: Checkout Form */}
        <div className='lg:col-span-2 space-y-4'>
          {/* Contact Information */}
          <div className='rounded-xl border bg-white p-6 space-y-4'>
            <div className='h-4 w-40 bg-gray-200 rounded' />

            <div className='grid md:grid-cols-2 gap-4'>
              {[1, 2].map((i) => (
                <div key={i} className='space-y-2'>
                  <div className='h-3 w-24 bg-gray-200 rounded' />
                  <div className='h-10 bg-gray-200 rounded-md' />
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className='rounded-xl border bg-white p-6 space-y-4'>
            <div className='h-4 w-40 bg-gray-200 rounded' />

            <div className='space-y-2'>
              <div className='h-3 w-32 bg-gray-200 rounded' />
              <div className='h-10 bg-gray-200 rounded-md' />
            </div>

            <div className='grid grid-cols-6 gap-4'>
              {[3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`space-y-2 ${
                    i === 3
                      ? 'col-span-3'
                      : i === 4
                      ? 'col-span-1'
                      : 'col-span-2'
                  }`}
                >
                  <div className='h-3 w-20 bg-gray-200 rounded' />
                  <div className='h-10 bg-gray-200 rounded-md' />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className='rounded-xl border bg-white p-6 space-y-4'>
            <div className='h-4 w-40 bg-gray-200 rounded' />
            <div className='h-11 bg-gray-200 rounded-md' />
            <div className='h-3 w-64 bg-gray-200 rounded' />
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className='lg:col-span-1'>
          <div className='sticky top-20 rounded-xl border bg-white p-6 space-y-6'>
            {/* Title */}
            <div className='h-5 w-40 bg-gray-200 rounded' />

            {/* Item previews */}
            <div className='space-y-3'>
              {[1, 2].map((i) => (
                <div key={i} className='flex gap-3 items-center'>
                  <div className='w-16 h-16 bg-gray-200 rounded-lg shrink-0' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-3 w-full bg-gray-200 rounded' />
                    <div className='h-3 w-20 bg-gray-200 rounded' />
                  </div>
                  <div className='h-3 w-12 bg-gray-200 rounded' />
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className='h-px bg-gray-200' />

            {/* Totals */}
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex justify-between'>
                  <div className='h-3 w-24 bg-gray-200 rounded' />
                  <div className='h-3 w-16 bg-gray-200 rounded' />
                </div>
              ))}
            </div>

            <div className='h-px bg-gray-200' />

            {/* Total */}
            <div className='flex justify-between items-center'>
              <div className='h-4 w-24 bg-gray-200 rounded' />
              <div className='h-5 w-28 bg-gray-200 rounded' />
            </div>

            {/* Info banner */}
            <div className='h-12 bg-gray-200 rounded-lg' />

            {/* CTA */}
            <div className='h-11 bg-gray-200 rounded-md' />

            {/* Disclaimer */}
            <div className='h-3 w-3/4 bg-gray-200 rounded mx-auto' />
          </div>
        </div>
      </div>
    </div>
  );
}
