"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendBookingEmail } from "@/action/emailAction";
import { z } from "zod";

const packages = [
  {
    title: "Debut",
    price: "₱4,500",
    description: "100+ photos, 16GB USB included",
    benefits: [
      "Whole event coverage",
      "100+ edited photos",
      "Online gallery",
      "16GB USB with photos",
    ],
  },
  {
    title: "Pre-Debut",
    price: "₱3,000",
    description: "100+ photos, 16GB USB included",
    benefits: [
      "Whole event coverage",
      "100+ edited photos",
      "Online gallery",
      "16GB USB with photos",
    ],
  },
  {
    title: "Civil Wedding",
    price: "₱4,500",
    description: "100+ photos, 16GB USB included",
    benefits: [
      "Whole event coverage",
      "100+ edited photos",
      "Online gallery",
      "16GB USB with photos",
    ],
  },
  {
    title: "Pre-Wedding",
    price: "₱3,500",
    description: "100+ photos, 16GB USB included",
    benefits: [
      "Whole event coverage",
      "100+ edited photos",
      "Online gallery",
      "16GB USB with photos",
    ],
  },
  {
    title: "Wedding",
    price: "₱10,000",
    description: "100+ photos, 16GB USB included, 2 photographers",
    benefits: [
      "Whole event coverage",
      "100+ edited photos",
      "Online gallery",
      "16GB USB with photos",
      "2 photographers",
    ],
  },
];

const BookingSchema = z.object({
  package: z
    .string()
    .min(1, "Package is required")
    .max(500, "Package must be 500 characters or less"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less")
    .transform((val) => val.trim()),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or less")
    .transform((val) => val.trim()),
  facebook: z
    .string()
    .min(1, "Facebook name or link is required")
    .max(200, "Facebook name or link must be 200 characters or less")
    .transform((val) => val.trim()),
  address: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be 200 characters or less")
    .transform((val) => val.trim()),
  contactNumber: z
    .string()
    .min(1, "Contact number is required")
    .regex(
      /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
      "Invalid contact number"
    )
    .transform((val) => val.trim()),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .transform((val) => val.trim()),
  date: z
    .string()
    .min(1, "Event date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)")
    .transform((val) => val.trim()),
});

export default function PricingSection() {
  const [selectedPackage, setSelectedPackage] = useState<
    (typeof packages)[0] | null
  >(null);
  const [formData, setFormData] = useState({
    package: "",
    firstName: "",
    lastName: "",
    facebook: "",
    address: "",
    contactNumber: "",
    email: "",
    date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (pkg: (typeof packages)[0]) => {
    setSelectedPackage(pkg);
    setFormData((prev) => ({ ...prev, package: pkg.title }));
    setIsDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "package" || name === "facebook" ? value : value.trim(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = BookingSchema.safeParse(formData);
    if (!validation.success) {
      console.error("Client validation failed:", validation.error);
      toast.error(
        validation.error.issues?.[0]?.message || "Invalid input data"
      );
      setIsSubmitting(false);
      return;
    }

    const result = await sendBookingEmail(formData);

    if (result.success) {
      toast.success(result.message || "Booking request sent successfully!");
      setFormData({
        package: selectedPackage?.title || "",
        firstName: "",
        lastName: "",
        facebook: "",
        address: "",
        contactNumber: "",
        email: "",
        date: "",
      });
      setIsDialogOpen(false);
    } else {
      toast.error(result.message || "Failed to send booking request");
    }

    setIsSubmitting(false);
  };

  return (
    <section
      id="pricing-section"
      className="px-4 py-8 text-center bg-white text-black scroll-smooth border-t-1"
    >
      <div className="max-w-7xl mx-auto mt-5">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-wrap break-words mt-5 pt-10">
          Give it a Shoot!
        </h2>
        <p className="text-base sm:text-md md:text-xl text-gray-600 mt-4 text-wrap break-words">
          choose your right package.
        </p>
        <p className="md:text-base sm:text-sm text-gray-500 mt-1 text-wrap break-words">
          Photo turnover: 3-4 days after shoot.
          <br />
          Express (1-2 days): +₱500.
          <br />
          Prices may vary depending on location and event type.
        </p>
        <div className="mt-8 flex flex-row overflow-x-auto snap-x snap-mandatory space-x-4 pb-4">
          {packages.map((pkg, index) => (
            <Dialog
              key={index}
              open={isDialogOpen && selectedPackage?.title === pkg.title}
              onOpenChange={(open) => {
                if (open) handleOpenDialog(pkg);
                else setIsDialogOpen(false);
              }}
            >
              <DialogTrigger asChild>
                <div className="min-w-[250px] sm:min-w-[300px] snap-center">
                  <Card className="w-full max-w-xs sm:max-w-sm mx-auto min-h-[350px] sm:min-h-[400px] bg-white border-gray-200/30 rounded-none shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 sm:p-6 pb-0">
                      <CardTitle className="text-lg sm:text-xl md:text-2xl font-regular text-center text-wrap break-words">
                        {pkg.title}
                      </CardTitle>
                      <div
                        className={`mt-2 px-3 py-1 rounded-full text-xs ${
                          pkg.title === "Wedding"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        } text-wrap break-words`}
                      >
                        {pkg.title === "Wedding"
                          ? "Most Popular"
                          : "Recommended"}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-4 pb-0 text-left">
                      <p className="text-xs sm:text-sm text-gray-600 text-center text-wrap break-words">
                        {pkg.description}
                      </p>
                      <ul className="mt-4 space-y-2">
                        {pkg.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center">
                            <div className="rounded-full p-1 sm:p-2 fill-current text-green-700">
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-700 ml-2 sm:ml-3 text-wrap break-words">
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="p-4 sm:p-6 pt-4 flex flex-col items-center gap-2">
                      <p className="text-sm sm:text-base font-bold text-wrap break-words">
                        {pkg.price}
                      </p>
                      <Button
                        variant="outline"
                        className="w-full uppercase text-xs sm:text-sm text-white bg-black font-bold py-2 px-4"
                        onClick={() => handleOpenDialog(pkg)}
                      >
                        Choose
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md w-[95vw] rounded-lg p-0 overflow-hidden">
                <div className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-center text-lg sm:text-xl">
                      Book {selectedPackage?.title}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-black text-sm">
                        Event Date
                      </Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="bg-white text-black border-gray-300 text-sm h-10 [&::-webkit-calendar-picker-indicator]:filter-none"
                        min={
                          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .split("T")[0]
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="package" className="text-black text-sm">
                        Package
                      </Label>
                      <Textarea
                        id="package"
                        name="package"
                        value={formData.package}
                        className="bg-white text-black border-gray-300 text-sm min-h-[80px]"
                        readOnly
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="firstName"
                          className="text-black text-sm"
                        >
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="bg-white text-black border-gray-300 text-sm h-10"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="lastName"
                          className="text-black text-sm"
                        >
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="bg-white text-black border-gray-300 text-sm h-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-black text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-white text-black border-gray-300 text-sm h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="text-black text-sm">
                        Facebook Name or Link
                      </Label>
                      <Input
                        id="facebook"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleInputChange}
                        className="bg-white text-black border-gray-300 text-sm h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-black text-sm">
                        Address
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="bg-white text-black border-gray-300 text-sm h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="contactNumber"
                        className="text-black text-sm"
                      >
                        Contact Number
                      </Label>
                      <Input
                        id="contactNumber"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        className="bg-white text-black border-gray-300 text-sm h-10"
                        required
                        type="tel"
                      />
                    </div>
                    <div className="sticky bottom-0 bg-white pt-4 pb-2">
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-sm h-10"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Book Now!"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
        <div className="mt-6 overflow-x-auto">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-center text-wrap break-words">
            Package Comparison
          </h3>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  Feature
                </TableHead>
                <TableHead className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  Debut
                </TableHead>
                <TableHead className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  Pre-Debut
                </TableHead>
                <TableHead className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  Civil Wedding
                </TableHead>
                <TableHead className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  Pre-Wedding
                </TableHead>
                <TableHead className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  Wedding
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center font-medium p-2 sm:p-3 text-xs text-wrap break-words">
                  Price
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  ₱4,500
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  ₱3,000
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  ₱4,500
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  ₱3,500
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  ₱10,000
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center font-medium p-2 sm:p-3 text-xs text-wrap break-words">
                  Photos
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  100+
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  100+
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  100+
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  100+
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  100+
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center font-medium p-2 sm:p-3 text-xs text-wrap break-words">
                  USB
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  16GB
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  16GB
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  16GB
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  16GB
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  16GB
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center font-medium p-2 sm:p-3 text-xs text-wrap break-words">
                  Photographers
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  1
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  1
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  1
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  1
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  2
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center font-medium p-2 sm:p-3 text-xs text-wrap break-words">
                  Coverage
                </TableCell>
                {packages.map((pkg) => (
                  <TableCell
                    key={pkg.title}
                    className="text-center p-2 sm:p-3 text-xs text-wrap break-words"
                  >
                    Whole event
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="text-center font-medium p-2 sm:p-3 text-xs text-wrap break-words">
                  Turnover
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  3-4 days
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  3-4 days
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  3-4 days
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  3-4 days
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3 text-xs text-wrap break-words">
                  3-4 days
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
