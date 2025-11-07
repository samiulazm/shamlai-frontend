export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-brand-indigo"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 bg-brand-indigo rounded-full opacity-75 animate-pulse"></div>
          </div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

