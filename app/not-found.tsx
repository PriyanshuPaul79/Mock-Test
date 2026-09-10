import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-left">
      <div className="max-w-md w-full border border-line bg-surface p-8 rounded-md space-y-4">
        <h1 className="font-display text-2xl font-medium text-ink">
          Page not found
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed">
          The page you requested does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Button variant="primary" asChild>
            <Link href="/">Return to upload</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
