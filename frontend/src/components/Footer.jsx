import { Link } from "react-router-dom";

export default function Footer() {
  const socialLinks = [
    {
      name: "Instagram",
      url: "https://www.instagram.com/festivalofindependence?igsi=MTV3NXNkYTVpbWo3cQ==",
      hoverClass: "hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:text-white hover:border-transparent hover:shadow-pink-500/20",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      url: "https://www.facebook.com/people/Festival-Of-Independence/61593296978002/",
      hoverClass: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] hover:shadow-blue-500/20",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      url: "https://www.youtube.com/channel/UCS1dk26eeFnMsHbcjgGJnig",
      hoverClass: "hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] hover:shadow-red-500/20",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-navy text-white/80 mt-16 border-t border-white/10 relative overflow-hidden">
      {/* Top Gradient Border */}
      <div className="h-1 w-full bg-gradient-to-r from-saffron via-white to-indiagreen" />

      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-saffron/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indiagreen/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Brand & Mission */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 font-black text-xl tracking-tight hover:opacity-90 transition-opacity">
              <span className="text-saffron">Festival</span>
              <span className="text-white">of</span>
              <span className="text-indiagreen">Independence</span>
            </Link>
            <p className="text-xs text-white/70 leading-relaxed">
              Hosted by <span className="text-white font-semibold">ISKCON Youth Forum (IYF) Kolkata</span>. 
              Inspiring the youth of Bharat Varsha towards purpose, leadership, and cultural heritage.
            </p>
            <p className="text-[11px] text-saffron/90 font-bold tracking-wide uppercase">
              🇮🇳 80th Independence Day Celebration
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Quick Links</h3>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link to="/" className="text-white/70 hover:text-saffron transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/70 hover:text-saffron transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/support-us" className="text-white/70 hover:text-saffron transition-colors">
                  Support Us
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-white/70 hover:text-saffron transition-colors">
                  Student Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Follow Us</h3>
            </div>
            <p className="text-xs text-white/70">
              Stay connected with us on social media for festival updates, schedules, and live highlights.
            </p>

            {/* Social Media Buttons */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow Festival of Independence on ${social.name}`}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white/90 font-bold text-xs transition-all duration-200 shadow-sm hover:scale-105 active:scale-95 ${social.hoverClass}`}
                >
                  {social.icon}
                  <span>{social.name}</span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/50 text-center sm:text-left">
            <p>&copy; {new Date().getFullYear()} ISKCON Youth Forum, Kolkata. All rights reserved.</p>
            <p className="text-white/60 font-medium">
              Festival of Independence — <span className="text-saffron">Bharat Varsha</span>
            </p>
          </div>
          {/* Legal Links */}
          <div className="flex items-center justify-center gap-1 text-[11px] text-white/35 flex-wrap">
            <Link to="/privacy-policy" className="hover:text-saffron transition-colors font-semibold px-1.5 py-0.5 rounded hover:bg-white/5">
              Privacy Policy
            </Link>
            <span className="text-white/20">·</span>
            <Link to="/terms" className="hover:text-saffron transition-colors font-semibold px-1.5 py-0.5 rounded hover:bg-white/5">
              Terms &amp; Conditions
            </Link>
            <span className="text-white/20">·</span>
            <Link to="/contact" className="hover:text-saffron transition-colors font-semibold px-1.5 py-0.5 rounded hover:bg-white/5">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
