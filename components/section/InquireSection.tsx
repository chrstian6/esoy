"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendInquiryEmail } from "@/action/emailAction";

export default function InquireSection() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    package: "",
    firstName: "",
    lastName: "",
    facebook: "",
    address: "",
    contactNumber: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill package from URL query
  useEffect(() => {
    const pkg = searchParams.get("package");
    if (pkg) {
      console.log("SearchParams package:", pkg); // Debug
      setFormData((prev) => ({ ...prev, package: decodeURIComponent(pkg) }));
    }
  }, [searchParams]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Preserve spaces for package, facebook, and address; trim others
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "package" || name === "facebook" || name === "address"
          ? value
          : value.trim(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("Submitting form data:", formData); // Debug
    const result = await sendInquiryEmail(formData);

    if (result.success) {
      toast.success(result.message || "Inquiry sent successfully!");
      setFormData({
        package: "",
        firstName: "",
        lastName: "",
        facebook: "",
        address: "",
        contactNumber: "",
        email: "",
      });
    } else {
      toast.error(result.message || "Failed to send inquiry");
    }

    setIsSubmitting(false);
  };

  return (
    <section id="inquire-section" className="px-4 pt-16 pb-8 overflow-x-hidden">
      <div className="bg-white text-black rounded-xl py-6 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
        <hr className="border-gray-300 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8">
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-7xl font-bold text-black tracking-tight text-left text-wrap break-words leading-[0.7]">
              Get in
              <br />
              Touch
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-4 max-w-[90%] leading-relaxed text-left text-wrap break-words">
              Let us capture your special moments. Fill out the form to get
              started.
            </p>
          </div>
          <div className="relative">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="package"
                  className="text-black text-base sm:text-lg"
                >
                  I want to inquire for
                </Label>
                <Textarea
                  id="package"
                  name="package"
                  value={formData.package}
                  onChange={handleInputChange}
                  className="bg-white text-black border-gray-300 text-base sm:text-lg w-full min-h-[100px]"
                  required
                  placeholder="Enter package or service"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-black text-base sm:text-lg"
                  >
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="bg-white text-black border-gray-300 text-base sm:text-lg w-full"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-black text-base sm:text-lg"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="bg-white text-black border-gray-300 text-base sm:text-lg w-full"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-black text-base sm:text-lg"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-white text-black border-gray-300 text-base sm:text-lg w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="facebook"
                  className="text-black text-base sm:text-lg"
                >
                  Facebook Name or Link
                </Label>
                <Input
                  id="facebook"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleInputChange}
                  className="bg-white text-black border-gray-300 text-base sm:text-lg w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-black text-base sm:text-lg"
                >
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="bg-white text-black border-gray-300 text-base sm:text-lg w-full"
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="contactNumber"
                  className="text-black text-base sm:text-lg"
                >
                  Contact Number
                </Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="bg-white text-black border-gray-300 text-base sm:text-lg w-full"
                  required
                  type="tel"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-base sm:text-lg font-bold cursor-pointer py-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
