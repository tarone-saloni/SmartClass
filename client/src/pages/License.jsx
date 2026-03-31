import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const OSS_LICENSES = [
  { name: "React", version: "18.x", license: "MIT" },
  { name: "React Router", version: "6.x", license: "MIT" },
  { name: "Tailwind CSS", version: "3.x", license: "MIT" },
  { name: "Vite", version: "5.x", license: "MIT" },
  { name: "Express", version: "4.x", license: "MIT" },
  { name: "Mongoose", version: "8.x", license: "MIT" },
  { name: "jsonwebtoken", version: "9.x", license: "MIT" },
  { name: "bcryptjs", version: "2.x", license: "MIT" },
  { name: "socket.io", version: "4.x", license: "MIT" },
];

function License() {
  const { themeName } = useContext(ThemeContext);

  return (
    <div
      data-theme={themeName}
      className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]"
    >
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
              Legal
            </span>
            <h1 className="text-4xl font-extrabold text-[var(--text)] mb-2">
              License
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Last updated: March 1, 2026
            </p>
          </div>

          {/* SmartClass License */}
          <div className="p-6 rounded-2xl border border-[var(--border)]/40 bg-[var(--card)] mb-10">
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">
              SmartClass Software License
            </h2>
            <div className="font-mono text-xs text-[var(--muted)] leading-relaxed space-y-3 bg-[var(--bg)] p-5 rounded-xl border border-[var(--border)]/30">
              <p>MIT License</p>
              <p>Copyright (c) 2023–2026 SmartClass Inc.</p>
              <p>
                Permission is hereby granted, free of charge, to any person
                obtaining a copy of this software and associated documentation
                files (the "Software"), to deal in the Software without
                restriction, including without limitation the rights to use,
                copy, modify, merge, publish, distribute, sublicense, and/or
                sell copies of the Software, and to permit persons to whom the
                Software is furnished to do so, subject to the following
                conditions:
              </p>
              <p>
                The above copyright notice and this permission notice shall be
                included in all copies or substantial portions of the Software.
              </p>
              <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
                OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
                NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
                HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
                WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
                FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
                OTHER DEALINGS IN THE SOFTWARE.
              </p>
            </div>
          </div>

          {/* Third-party licenses */}
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] mb-2">
              Third-Party Open Source Licenses
            </h2>
            <p className="text-sm text-[var(--muted)] mb-6">
              SmartClass is built on the following open source packages. We are
              grateful to their maintainers and communities.
            </p>
            <div className="rounded-2xl border border-[var(--border)]/40 bg-[var(--card)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]/30">
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Package
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Version
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      License
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {OSS_LICENSES.map((pkg, i) => (
                    <tr
                      key={pkg.name}
                      className={`border-b border-[var(--border)]/20 last:border-0 ${
                        i % 2 === 0 ? "" : "bg-[var(--bg)]/30"
                      }`}
                    >
                      <td className="px-5 py-3 font-medium text-[var(--text)]">
                        {pkg.name}
                      </td>
                      <td className="px-5 py-3 text-[var(--muted)] font-mono text-xs">
                        {pkg.version}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--accent)]/10 text-[var(--accent)]">
                          {pkg.license}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default License;
