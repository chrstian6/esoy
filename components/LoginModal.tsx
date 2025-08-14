// components/LoginModal.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/stores";
import { getUserEmail } from "@/action/userAction";
import { checkAuth } from "@/action/authActions";
import { sendOtp, verifyOtp } from "@/action/otpActions";
import { Loader2 } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 characters" }),
});

export default function LoginModal() {
  const {
    isLoginModalOpen,
    isOtpModalOpen,
    closeLoginModal,
    openOtpModal,
    closeOtpModal,
    openSettingsModal,
  } = useModalStore();

  const [email, setEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState({
    send: false,
    verify: false,
    resend: false,
  });
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      const result = await checkAuth();
      setIsAuthenticated(result.success);
    };
    checkAuthStatus();
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Fetch email when login modal opens
  useEffect(() => {
    async function fetchEmail() {
      setIsLoading((prev) => ({ ...prev, send: true }));
      const result = await getUserEmail();
      if (result.success && result.email) {
        setEmail(result.email);
        emailForm.setValue("email", result.email);
      } else {
        toast.error(result.message);
        closeLoginModal();
      }
      setIsLoading((prev) => ({ ...prev, send: false }));
    }

    if (isLoginModalOpen && !isAuthenticated) {
      fetchEmail();
    }
  }, [isLoginModalOpen, emailForm, closeLoginModal, isAuthenticated]);

  const onEmailSubmit = async () => {
    setIsLoading((prev) => ({ ...prev, send: true }));
    const result = await sendOtp();
    if (result.success) {
      toast.success(result.message);
      closeLoginModal();
      openOtpModal();
      setOtpTimer(300); // 5 minutes in seconds
    } else {
      toast.error(result.message);
    }
    setIsLoading((prev) => ({ ...prev, send: false }));
  };

  const onResendOtp = async () => {
    setIsLoading((prev) => ({ ...prev, resend: true }));
    const result = await sendOtp();
    if (result.success) {
      toast.success("New OTP sent successfully");
      setOtpDigits(["", "", "", "", "", ""]);
      otpForm.reset();
      setOtpTimer(300); // Reset timer to 5 minutes
      inputRefs.current[0]?.focus();
    } else {
      toast.error(result.message);
    }
    setIsLoading((prev) => ({ ...prev, resend: false }));
  };

  const onOtpSubmit = async (data: z.infer<typeof otpSchema>) => {
    setIsLoading((prev) => ({ ...prev, verify: true }));
    const result = await verifyOtp(data);
    if (result.success) {
      toast.success("Successfully verified!");
      closeOtpModal();
      openSettingsModal();
      otpForm.reset();
      setOtpDigits(["", "", "", "", "", ""]);
      setIsAuthenticated(true);
    } else {
      toast.error(result.message);
    }
    setIsLoading((prev) => ({ ...prev, verify: false }));
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[A-Za-z0-9]?$/.test(value)) return;
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.toUpperCase(); // Force uppercase
    setOtpDigits(newOtpDigits);
    otpForm.setValue("otp", newOtpDigits.join(""));
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().toUpperCase();
    if (/^[A-Za-z0-9]{6}$/.test(pastedData)) {
      const newOtpDigits = pastedData.split("");
      setOtpDigits(newOtpDigits);
      otpForm.setValue("otp", pastedData);
      inputRefs.current[5]?.focus();
    }
  };

  // Don't show login modal if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Login Modal */}
      <Dialog
        open={isLoginModalOpen}
        onOpenChange={(open) => {
          if (!isLoading.send) {
            if (!open) closeLoginModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Access Code</DialogTitle>
          </DialogHeader>
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              className="space-y-4"
            >
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={true} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading.send || !email}
              >
                {isLoading.send ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Access Code"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* OTP Modal */}
      <Dialog
        open={isOtpModalOpen}
        onOpenChange={(open) => {
          if (!isLoading.verify) {
            if (!open) closeOtpModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              Verify Your Identity
            </DialogTitle>
          </DialogHeader>
          <Form {...otpForm}>
            <form
              onSubmit={otpForm.handleSubmit(onOtpSubmit)}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>

              <FormField
                control={otpForm.control}
                name="otp"
                render={() => (
                  <FormItem>
                    <FormLabel className="sr-only">6-Character OTP</FormLabel>
                    <FormControl>
                      <div className="flex justify-center gap-3">
                        {otpDigits.map((digit, index) => (
                          <Input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handleOtpChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={index === 0 ? handleOtpPaste : undefined}
                            ref={(el) => {
                              inputRefs.current[index] = el;
                            }}
                            className="w-12 h-14 text-center text-xl font-mono"
                            autoFocus={index === 0}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-center">
                {otpTimer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Code expires in {Math.floor(otpTimer / 60)}:
                    {(otpTimer % 60).toString().padStart(2, "0")}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive a code?
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading.verify || otpDigits.some((d) => !d)}
                >
                  {isLoading.verify ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading.resend || otpTimer > 0}
                  onClick={onResendOtp}
                >
                  {isLoading.resend ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
