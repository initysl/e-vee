import Navbar from '@/components/NavBar';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className='mt-24 h-[calc(100vh-6rem)] overflow-y-auto p-4 rounded-2xl'>
        {children}
      </main>
    </>
  );
}
