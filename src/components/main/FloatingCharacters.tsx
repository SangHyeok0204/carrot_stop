'use client';

export function FloatingCharacters() {
  return (
    <>

      {/* 주변 작은 캐릭터들 */}
      <div
        className="absolute left-[15%] top-[25%] pointer-events-none"
        style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}
      >
        <div className="text-3xl sm:text-4xl select-none opacity-80">
          ✨
        </div>
      </div>

      <div
        className="absolute right-[18%] top-[20%] pointer-events-none"
        style={{ animation: 'float 4.5s ease-in-out infinite 1s' }}
      >
        <div className="text-3xl sm:text-4xl select-none opacity-80">
          💡
        </div>
      </div>

      <div
        className="absolute left-[20%] bottom-[25%] pointer-events-none"
        style={{ animation: 'float 5.5s ease-in-out infinite 0.3s' }}
      >
        <div className="text-2xl sm:text-3xl select-none opacity-70">
          🎯
        </div>
      </div>

      <div
        className="absolute right-[15%] bottom-[30%] pointer-events-none"
        style={{ animation: 'float 4s ease-in-out infinite 1.5s' }}
      >
        <div className="text-2xl sm:text-3xl select-none opacity-70">
          💜
        </div>
      </div>

      {/* CSS Keyframes */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </>
  );
}
