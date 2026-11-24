import { useReducedMotion } from 'motion/react';

export function HomeSkeleton() {
  const shouldReduceMotion = useReducedMotion();
  const shimmerClass = shouldReduceMotion ? '' : 'animate-pulse';

  return (
    <div className="space-y-5 pb-8" aria-busy="true" aria-label="Cargando resumen mensual">
      {/* Hero placeholder */}
      <div className="flex flex-col items-center pt-2 pb-3 md:pt-4 md:pb-5">
        <div
          className={`h-24 w-24 rounded-full bg-black/8 dark:bg-[#1d1d1f] ${shimmerClass}`}
        />
        <div
          className={`mt-4 h-3 w-36 rounded-full bg-black/8 dark:bg-[#1d1d1f] ${shimmerClass}`}
        />
        <div
          className={`mt-3 h-9 w-56 rounded-2xl bg-black/8 dark:bg-[#1d1d1f] ${shimmerClass}`}
        />
        <div
          className={`mt-2.5 h-3.5 w-64 rounded-full bg-black/8 dark:bg-[#1d1d1f] ${shimmerClass}`}
        />
      </div>

      {/* Month selector skeleton */}
      <div
        className={`h-[70px] rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] ${shimmerClass}`}
      />

      {/* Balance + Primary Goal grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className={`h-4 w-28 rounded-full bg-black/8 dark:bg-black ${shimmerClass}`} />
            <div className={`h-10 w-36 rounded-full bg-black/8 dark:bg-black ${shimmerClass}`} />
          </div>
          <div className={`h-14 w-52 rounded-2xl bg-black/10 dark:bg-black ${shimmerClass}`} />
          <div className={`h-4 w-72 rounded-full bg-black/8 dark:bg-black ${shimmerClass}`} />
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-black/8 dark:border-[#333336]">
            <div className={`h-12 rounded-2xl bg-black/8 dark:bg-black ${shimmerClass}`} />
            <div className={`h-12 rounded-2xl bg-black/8 dark:bg-black ${shimmerClass}`} />
          </div>
        </div>

        <div className="lg:col-span-5 rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className={`h-4 w-32 rounded-full bg-black/8 dark:bg-black ${shimmerClass}`} />
            <div className={`h-4 w-20 rounded-full bg-black/8 dark:bg-black ${shimmerClass}`} />
          </div>
          <div className={`h-7 w-44 rounded-xl bg-black/10 dark:bg-black ${shimmerClass}`} />
          <div className={`h-10 w-36 rounded-xl bg-black/8 dark:bg-black ${shimmerClass}`} />
          <div className={`h-3 w-full rounded-full bg-black/8 dark:bg-black ${shimmerClass}`} />
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-black/8 dark:border-[#333336]">
            <div className={`h-10 rounded-xl bg-black/8 dark:bg-black ${shimmerClass}`} />
            <div className={`h-10 rounded-xl bg-black/8 dark:bg-black ${shimmerClass}`} />
          </div>
        </div>
      </div>

      {/* Charts + recent activity skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] p-6 sm:p-8 space-y-4">
          <div className={`h-5 w-44 rounded-full bg-black/10 dark:bg-black ${shimmerClass}`} />
          <div className={`h-8 w-full rounded-2xl bg-black/8 dark:bg-black ${shimmerClass}`} />
          <div className={`h-8 w-5/6 rounded-2xl bg-black/8 dark:bg-black ${shimmerClass}`} />
          <div className={`h-8 w-2/3 rounded-2xl bg-black/8 dark:bg-black ${shimmerClass}`} />
        </div>
        <div className="lg:col-span-5 rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] p-6 sm:p-8 space-y-4">
          <div className={`h-5 w-36 rounded-full bg-black/10 dark:bg-black ${shimmerClass}`} />
          <div className={`h-12 w-full rounded-2xl bg-black/8 dark:bg-black ${shimmerClass}`} />
          <div className={`h-12 w-full rounded-2xl bg-black/8 dark:bg-black ${shimmerClass}`} />
          <div className={`h-12 w-full rounded-2xl bg-black/8 dark:bg-black ${shimmerClass}`} />
        </div>
      </div>
    </div>
  );
}
