import Logo from './Logo';

export default function LogoWithText({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Logo className="w-12 h-12 md:w-16 md:h-16" />
      <div className="flex flex-col">
        <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
          Iana Ribnicova
        </h1>
        {showTagline && (
          <p className="text-xs md:text-sm text-purple-500 leading-tight">
            Your Past, Untangled-ish
          </p>
        )}
      </div>
    </div>
  );
}

