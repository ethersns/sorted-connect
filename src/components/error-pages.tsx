import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Frog, SpeechBubble } from "@/components/frog";

export function NotFoundPage() {
  return (
    <main className="pond grid min-h-svh place-items-center px-6 py-16">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex items-end justify-center gap-2">
          <Frog mood="sad" hoodie className="frog-bob w-32" />
          <SpeechBubble className="mb-16 -rotate-2">
            404. Empty lily pad.
          </SpeechBubble>
        </div>
        <h1 className="font-display text-4xl tracking-wide">Page not found</h1>
        <p className="text-muted-foreground">
          This page hopped off somewhere. Check the address or swim back to the
          home page.
        </p>
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}

export function RouteErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <main className="pond grid min-h-svh place-items-center px-6 py-16">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex items-end justify-center gap-2">
          <Frog mood="shook" hoodie className="w-32" />
          <SpeechBubble className="mb-16 rotate-2">
            Uh oh. Bad flies.
          </SpeechBubble>
        </div>
        <h1 className="font-display text-4xl tracking-wide">
          This page couldn’t load
        </h1>
        <p role="alert" className="text-muted-foreground">
          Please try again, or return to the home page.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => {
              void router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Go home</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
