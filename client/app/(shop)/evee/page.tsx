export default function EveePage() {
  return (
    <div className='container mx-auto'>
      {/* Header */}
      <div className='text-center mb-10'>
        <h1 className='text-2xl font-semibold text-gray-900'>E-vee</h1>
        <p className='mt-3 text-gray-600 text-sm'>
          A RAG-powered shopping assistant chatbot for finding products,
          managing your cart, and checking out through natural conversation.
        </p>
      </div>

      {/* What it does */}
      <section className='mb-12'>
        <h2 className='text-lg font-medium text-gray-900 mb-3'>
          What E-vee Can Do
        </h2>
        <div className='space-y-4 text-sm text-gray-600'>
          <p>
            <strong>Product Search:</strong> Find products using natural
            language, such as name, categories, or descriptions.
          </p>
          <p>
            <strong>Product Information:</strong> Get detailed information about
            any product by ID or description.
          </p>
          <p>
            <strong>Cart Management:</strong> Add, remove, or review cart items
            directly through chat.
          </p>
          <p>
            <strong>Quick Checkout:</strong> Add items and proceed to checkout
            in a single command.
          </p>
        </div>
      </section>

      {/* How to use */}
      <section className='mb-12'>
        <h2 className='text-lg font-medium text-gray-900 mb-3'>How to Use</h2>
        <div className='space-y-3 text-sm text-gray-600'>
          <p>Open E-vee using the chat interface.</p>
          <p>
            Type your request in plain language, no special syntax required.
          </p>
          <p>Follow prompts or action buttons for faster actions.</p>
          <p>Ask to checkout when you are ready to complete your purchase.</p>
        </div>
      </section>

      {/* Tips */}
      <section className='mb-12'>
        <h2 className='text-lg font-medium text-gray-900 mb-3'>Tips</h2>
        <div className='space-y-3 text-sm text-gray-600'>
          <p>Be specific. For example, I need some electronics</p>
          <p>I want some jewels</p>
          <p>I need some gadgets</p>
          <p>What's in my cart</p>
          <p>Add product 7 to cart</p>
          <p>Checkout</p>
          <p>
            Use product IDs for faster cart actions once you've found items you
            like.
          </p>
          <p>Keep messages short for the best response accuracy.</p>
        </div>
      </section>

      {/* Technical note */}
      <section>
        <h2 className='text-lg font-medium text-gray-900 mb-3'>
          Behind the Scenes ~This is a Demo Prototype
        </h2>
        <p className='text-sm text-gray-600'>
          E-vee uses intent classification and RAG-powered semantic search to
          understand requests. Conversations are session-based, and your cart
          stays synchronized in real time.
        </p>
      </section>
    </div>
  );
}
