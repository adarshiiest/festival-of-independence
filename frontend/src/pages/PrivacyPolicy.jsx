import { Link } from "react-router-dom";
import { Shield, ChevronRight } from "lucide-react";

export default function PrivacyPolicy() {
  const sections = [
    {
      id: "information-we-collect",
      title: "Information We Collect",
      content: (
        <p>
          We may collect information such as your <strong>name, email address, mobile number, college or institution details</strong>, and
          other information that you voluntarily provide while registering or using our website.
          <br /><br />
          We may also collect basic technical information, such as browser, device, and website usage information, to improve the
          functionality and performance of our website.
        </p>
      ),
    },
    {
      id: "how-we-use",
      title: "How We Use Your Information",
      content: (
        <>
          <p className="mb-3">The information we collect may be used to:</p>
          <ul className="space-y-2">
            {[
              "Process and manage event registrations",
              "Communicate important event-related information",
              "Respond to enquiries",
              "Improve our website and events",
              "Send relevant updates and communications",
              "Maintain website security and comply with applicable requirements",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-saffron flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-semibold text-navy">
            We do not sell or rent your personal information for commercial purposes.
          </p>
        </>
      ),
    },
    {
      id: "payments",
      title: "Payments",
      content: (
        <p>
          If online payments are available, transactions may be processed through trusted third-party payment providers such as{" "}
          <strong>Razorpay</strong> or other applicable providers.
          <br /><br />
          We do not store or have access to your complete card details, banking passwords, UPI PINs, or other sensitive payment
          credentials processed by these providers.
        </p>
      ),
    },
    {
      id: "cookies",
      title: "Cookies",
      content: (
        <p>
          Our website may use cookies and similar technologies to improve your browsing experience, understand website usage, and
          improve our services.
          <br /><br />
          We may also use third-party analytics or advertising services, such as <strong>Google Analytics</strong> or{" "}
          <strong>Meta Pixel</strong>, where applicable.
          <br /><br />
          You can manage or disable cookies through your browser settings. Some website features may not function properly if cookies
          are disabled.
        </p>
      ),
    },
    {
      id: "third-party",
      title: "Third-Party Services",
      content: (
        <p>
          We may use trusted third-party services for payments, hosting, analytics, communications, security, and other
          website-related functions.
          <br /><br />
          These services may process information as necessary to provide their services and are governed by their respective privacy
          policies.
        </p>
      ),
    },
    {
      id: "data-security",
      title: "Data Security",
      content: (
        <p>
          We take reasonable measures to protect the information provided to us from unauthorized access, misuse, or disclosure.
          However, no method of transmission or storage over the Internet can be guaranteed to be completely secure.
        </p>
      ),
    },
    {
      id: "your-information",
      title: "Your Information",
      content: (
        <p>
          You may contact us if you wish to enquire about, correct, or request deletion of your personal information, subject to
          applicable requirements.
          <br /><br />
          We retain information only for as long as reasonably necessary for event administration, organizational purposes, or legal
          requirements.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to This Policy",
      content: (
        <p>
          We may update this Privacy Policy from time to time. Any changes will be published on this page with an updated date.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Contact Us",
      content: (
        <p>
          For any questions or concerns regarding this Privacy Policy, please contact us through the official contact details
          provided on the Festival of Independence website.
          <br /><br />
          You may also reach us via the{" "}
          <Link to="/contact" className="text-saffron font-semibold hover:underline">
            Contact Us
          </Link>{" "}
          page on our website.
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Header */}
      <div className="relative bg-navy overflow-hidden">
        {/* Tricolor top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-saffron via-white to-indiagreen" />
        {/* Ambient glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indiagreen/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-white/50 font-medium mb-6">
            <Link to="/" className="hover:text-saffron transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/80">Privacy Policy</span>
          </div>

          <div className="flex items-start gap-5">
            <div className="p-3 rounded-2xl bg-saffron/15 border border-saffron/30 flex-shrink-0">
              <Shield className="w-7 h-7 text-saffron" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Privacy Policy
              </h1>
              <p className="mt-2 text-white/60 text-sm font-medium">
                Last Updated: <span className="text-white/80">September 6, 2026</span>
              </p>
            </div>
          </div>

          {/* Intro paragraph */}
          <div className="mt-8 p-5 rounded-2xl bg-white/5 border border-white/10 text-white/75 text-sm leading-relaxed">
            <strong className="text-white">Festival of Independence</strong> is organized by{" "}
            <strong className="text-saffron">ISKCON Kolkata</strong> under its youth wing,{" "}
            <strong className="text-white">ISKCON Youth Forum (IYF)</strong>. We respect your privacy and are committed to
            protecting the personal information you provide while using our website, registering for our events, or interacting
            with us.
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Table of Contents */}
        <div className="mb-12 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Contents</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {sections.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-saffron transition-colors group py-1"
                >
                  <span className="w-5 h-5 rounded-full bg-saffron/10 text-saffron text-[10px] font-black flex items-center justify-center flex-shrink-0 group-hover:bg-saffron group-hover:text-white transition-all">
                    {i + 1}
                  </span>
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {sections.map((section, i) => (
            <div
              key={section.id}
              id={section.id}
              className="scroll-mt-24 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Section header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-gray-50/60">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-saffron to-[#F57C00] text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-sm">
                  {i + 1}
                </div>
                <h2 className="text-base font-black text-navy">{section.title}</h2>
              </div>
              {/* Section body */}
              <div className="px-6 py-5 text-sm text-gray-600 leading-relaxed">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer identity card */}
        <div className="mt-12 p-6 rounded-2xl bg-navy text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-saffron/10 via-transparent to-indiagreen/10 pointer-events-none" />
          <div className="relative">
            <p className="text-white font-black text-lg">Festival of Independence</p>
            <p className="text-white/60 text-sm mt-1">
              Organized by{" "}
              <span className="text-saffron font-bold">ISKCON Kolkata – ISKCON Youth Forum (IYF)</span>
            </p>
            <p className="text-white/40 text-xs mt-2 font-medium">
              festivalofindependence.com
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold">
              <Link to="/privacy-policy" className="text-white/60 hover:text-saffron transition-colors">Privacy Policy</Link>
              <span className="text-white/20">|</span>
              <Link to="/terms" className="text-white/60 hover:text-saffron transition-colors">Terms &amp; Conditions</Link>
              <span className="text-white/20">|</span>
              <Link to="/contact" className="text-white/60 hover:text-saffron transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
