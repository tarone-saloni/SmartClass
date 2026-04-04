import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <h1>SmartClass Documentation</h1>
        <p>Welcome to the SmartClass docs site.</p>

        <h2>Quick Start</h2>
        <ol>
          <li>Install dependencies: <code>npm install</code></li>
          <li>Run locally: <code>npm run dev</code></li>
          <li>Open: <code>http://localhost:3000</code></li>
        </ol>

        <h2>Scripts</h2>
        <ul>
          <li><code>npm run dev</code> – Start development server</li>
          <li><code>npm run build</code> – Build production output</li>
          <li><code>npm start</code> – Run production server</li>
          <li><code>npm run lint</code> – Run lint checks</li>
        </ul>
      </main>
    </div>
  );
}
