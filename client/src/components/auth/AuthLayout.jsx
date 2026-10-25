/**
 * AuthLayout — Shared wrapper for Login and Signup pages.
 *
 * Layout rules:
 * - Container: min-h-dvh flex flex-col justify-start items-center
 *   sm:justify-center, px-4, pt-24 pb-12
 *   The pt-24 (96px) always clears the floating navbar (~68px top + 12px gap).
 * - Inner: w-full max-w-md — constrains the card width
 * - No h-screen or overflow-hidden — page scrolls naturally on short screens
 * - Uses div (not main) because PageShell already wraps content in <main>
 */
export function AuthLayout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col justify-start items-center sm:justify-center px-4 pt-24 pb-12">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
