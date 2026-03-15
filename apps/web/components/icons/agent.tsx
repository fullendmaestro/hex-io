export function AgentLogoSVG({
  className,
  width = 24,
  height = 24,
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 5C4.134 5 1 8.134 1 12C1 15.866 4.134 19 8 19H16C19.866 19 23 15.866 23 12C23 8.134 19.866 5 16 5H8ZM7.5 9.5C6.67157 9.5 6 10.1716 6 11V13C6 13.8284 6.67157 14.5 7.5 14.5C8.32843 14.5 9 13.8284 9 13V11C9 10.1716 8.32843 9.5 7.5 9.5ZM16.5 9.5C15.6716 9.5 15 10.1716 15 11V13C15 13.8284 15.6716 14.5 16.5 14.5C17.3284 14.5 18 13.8284 18 13V11C18 10.1716 17.3284 9.5 16.5 9.5Z"
        fill="currentColor"
      />
    </svg>
  );
}