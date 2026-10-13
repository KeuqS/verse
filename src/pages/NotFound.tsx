import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 font-literary">
      <div className="text-center max-w-md">
        <BookOpen className="h-12 w-12 text-literary-sage mx-auto mb-5" aria-hidden="true" />
        <h1 className="text-4xl font-bold text-foreground mb-4">Page not found</h1>
        <p className="text-muted-foreground mb-6">There is no page at this address. Your saved poems are in this browser's collection.</p>
        <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-primary-foreground font-medium hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Return home
        </Link>
      </div>
    </main>
  );
}
