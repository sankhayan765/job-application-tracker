import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="container mx-auto px-4 py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-black mb-6 text-6xl font-bold">
              A better way to track your job applications
            </h1>
            <p className="text-muted-foreground mb-10 text-xl">
              Capture, organise and manage your job search in one place!
            </p>
            <div>
              <button>Start for free</button>
              <p>Free forever. No credit card required</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
