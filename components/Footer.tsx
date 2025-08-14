// components/Footer.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Instagram, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white border-t mt-auto">
      <div className="w-full px-4 py-12 mx-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">GLN Photos</h3>
            <p className="text-sm text-gray-300">
              Capturing your precious moments with professional excellence.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-white hover:bg-white cursor-pointer"
              >
                <a href="https://www.instagram.com/gln_photos/" target="_blank">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-white hover:bg-white cursor-pointer"
              >
                <a href="https://www.facebook.com/ResumaGleen" target="_blank">
                  <Facebook className="h-5 w-5 cursor-pointer" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#profile-section"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing-section"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#inquire-section"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>6107 Binalbagan Negros Occidental</p>
              <p>Brgy. San Pedro</p>
              <p>glnphotos6107@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="w-full max-w-7xl mx-auto border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} GLN Photos. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
