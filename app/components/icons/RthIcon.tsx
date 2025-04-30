export default function RthIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="currentColor"
    >
      <path 
        fillRule="evenodd"
        d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 7c23.7 0 43 19.3 43 43S73.7 93 50 93 7 73.7 7 50 26.3 7 50 7zm-15 25c0 0 15 25 30 25 15 0 30-25 30-25s-15 40-30 40c-15 0-30-40-30-40z"
      />
    </svg>
  );
} 