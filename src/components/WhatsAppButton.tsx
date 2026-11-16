import { MessageCircle } from "lucide-react";
import { site } from "@/config/site";

/** Floating "Chat with us" button. Renders only when site.contact.whatsapp is set. */
export function WhatsAppButton() {
  const n = site.contact.whatsapp.replace(/\D/g, "");
  if (!n) return null;
  const text = encodeURIComponent("Hi Sociapa, I'd like to know more about your SEO, AEO and GEO services.");
  return (
    <a
      href={`https://wa.me/${n}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl animate-fade-up"
      style={{ animationDelay: "1.2s" }}
      aria-label="Chat with us on WhatsApp"
    >
      <span className="relative grid h-6 w-6 place-items-center">
        <span className="absolute inset-0 rounded-full bg-white/40 animate-ping-soft" aria-hidden />
        <MessageCircle size={20} aria-hidden />
      </span>
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
}
