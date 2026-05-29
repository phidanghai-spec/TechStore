'use client';

export default function ProductSkeleton() {
  return (
    <div className="col mb-4">
      <div className="product-item position-relative bg-black p-3 border border-secondary rounded h-100 d-flex flex-column justify-content-between animate-pulse">
        {/* Image holder placeholder */}
        <div className="bg-dark rounded shimmer" style={{ height: '220px' }}></div>
        
        {/* Info placeholder */}
        <div className="mt-3 flex-grow-1">
          <div className="bg-secondary rounded shimmer mb-2" style={{ height: '12px', width: '40%' }}></div>
          <div className="bg-secondary rounded shimmer mb-3" style={{ height: '20px', width: '85%' }}></div>
          <div className="bg-secondary rounded shimmer mb-2" style={{ height: '14px', width: '30%' }}></div>
        </div>

        <div className="mt-2">
          {/* Price placeholder */}
          <div className="bg-secondary rounded shimmer mb-3" style={{ height: '18px', width: '60%' }}></div>
          {/* Button placeholder */}
          <div className="bg-secondary rounded shimmer" style={{ height: '32px', width: '100%' }}></div>
        </div>
      </div>

      <style jsx global>{`
        .shimmer {
          animation: placeholderShimmer 1.5s infinite linear;
          background: linear-gradient(to right, #1a1a1a 8%, #333333 18%, #1a1a1a 33%);
          background-size: 800px 104px;
          position: relative;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .6;
          }
        }

        @keyframes placeholderShimmer {
          0% {
            background-position: -468px 0;
          }
          100% {
            background-position: 468px 0;
          }
        }
      `}</style>
    </div>
  );
}

export function ProductListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4 w-100 m-0">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductSkeleton key={idx} />
      ))}
    </div>
  );
}
