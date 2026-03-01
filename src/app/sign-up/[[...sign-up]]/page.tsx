import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="auth-page-bg">
      {/* Geometric background pattern */}
      <div className="auth-bg-pattern" aria-hidden="true" />
      <div className="auth-bg-glow" aria-hidden="true" />

      {/* Centered card */}
      <div className="auth-card-wrapper">
        {/* Brand header */}
        <div className="auth-brand">
          <div className="auth-brand-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="11" width="5" height="6" rx="1.5" fill="currentColor"/>
              <rect x="22" y="11" width="5" height="6" rx="1.5" fill="currentColor"/>
              <rect x="7" y="7" width="4" height="14" rx="1.5" fill="currentColor"/>
              <rect x="17" y="7" width="4" height="14" rx="1.5" fill="currentColor"/>
              <rect x="12" y="12" width="4" height="4" rx="1" fill="currentColor" opacity="0.6"/>
              <rect x="11" y="13" width="6" height="2" rx="1" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="auth-brand-name">LiftingDiary</h1>
          <p className="auth-brand-tagline">Your gains. Your story. Start today.</p>
          <p className="auth-brand-motto">Track your gains, crush your goals</p>
        </div>

        {/* Clerk component */}
        <div className="auth-clerk-wrapper">
          <SignUp />
        </div>

        {/* Footer hint */}
        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link href="/sign-in" className="auth-footer-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
