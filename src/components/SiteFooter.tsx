import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-800/60 bg-[#080E1A] py-6 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} RipeSpot Development, LLC. All rights reserved.
        </p>
        <nav className="flex items-center gap-5">
          <Link
            href="/terms"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <a
            href="mailto:steven@ripespotdevelopment.com"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
