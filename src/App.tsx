function App() {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <header className="bg-[#132445] text-white px-8">
        <div className="container mx-auto px-6 py-4">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
              </div>
              <span className="text-xl font-semibold">jabacus</span>
            </div>
            <div className="font-semibold flex items-center space-x-8">
              <a
                href="#"
                className="text-white hover:text-blue-200 transition-colors"
              >
                Calculators
              </a>
              <a
                href="#"
                className="text-white hover:text-blue-200 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#"
                className="text-white hover:text-blue-200 transition-colors"
              >
                Contact
              </a>
              <button className="bg-[#10446e] flex items-center gap-2 px-2 py-1 rounded-lg border border-[#0c93d4]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 20a6 6 0 0 0-12 0" />
                  <circle cx="12" cy="10" r="4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Log In
              </button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 pb-16">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Online construction calculators, trusted by engineers
              </h1>
              <div className="flex space-x-4">
                <button className="bg-[#10446e] flex items-center gap-2 px-6 py-1 rounded-lg border border-[#0c93d4]">
                  Try for Free
                </button>
                <button className="rounded-lg border border-white text-white px-6 py-3 bg-transparent">
                  See All Calculators
                </button>
              </div>
            </div>
            <div className="lg:justify-self-end md:text-xs lg:text-lg lg:w-22/30 leading-relaxed space-y-4 font-mono pt-4">
              <p>
                From seismic and wind loads to concrete and critical
                connections, jabacus replaces spreadsheets with
                precise, up-to-code tools so you can save time and
                reduce errors.
              </p>
              <p>Canadian Code Compliant.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Section */}
      <main className="bg-gray-50 py-16 px-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left Column */}
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Your spreadsheets wouldn't stand up to code
              </h2>
              <div className="font-mono text-gray-700 leading-relaxed space-y-4 mb-8">
                <p>
                  Structural engineering runs on codes and standards
                  that shift every few years. When they do, most
                  engineers are left scrambling to update old Excel
                  files or rebuild custom spreadsheets.
                </p>
                <p>
                  If you're still relying on spreadsheets, you're
                  risking more than your time:
                </p>
              </div>
              <div className="rounded-lg overflow-hidden">
                <img
                  src="/construction-drawing.png"
                  alt="Engineer working on construction drawings with calculator and plans"
                  width={500}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  They're clunky
                </h3>
                <p className="text-gray-700">
                  Updating for code changes eats up valuable hours.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  They're fragile
                </h3>
                <p className="text-gray-700">
                  One wrong cell entry can throw off an entire
                  calculation.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  They age fast
                </h3>
                <p className="text-gray-700">
                  Building codes evolve constantly - and keeping up is
                  costly.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Hard to share
                </h3>
                <p className="text-gray-700">
                  Is the version you're using the latest?
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Leave room for risk
                </h3>
                <p className="text-gray-700">
                  Outdated calculations can put projects at risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
