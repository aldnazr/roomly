"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconDoorEnter,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconUserPlus,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { RegisterInput, registerSchema } from "@/features/auth/schema";
import { useRegister } from "@/features/auth/use-auth";

function BrandMark() {
  return (
    <div className="flex items-center gap-3" aria-label="Roomly">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <IconDoorEnter aria-hidden="true" />
      </span>
      <span className="font-heading text-lg font-semibold tracking-tight">
        Roomly
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      terms: false,
    },
  });

  const passwordValue = watch("password") || "";
  const isMinLength = passwordValue.length >= 8;

  const { mutate, isPending } = useRegister();

  const isLoading = isSubmitting || isPending;

  function onSubmit(data: RegisterInput) {
    mutate(data, {
      onSuccess: () => {
        router.push("/login?registered=true");
      },
      onError: (err: unknown) => {
        const errorObj = err as { response?: { data?: { message?: string } } };
        const message =
          errorObj.response?.data?.message ||
          "Gagal mendaftar. Silakan periksa kembali data Anda.";
        setError("root", { message });
      },
    });
  }

  return (
    <main className="grid min-h-svh bg-muted/40 lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)]">
      {/* Brand Hero Panel */}
      <section className="dark relative hidden min-h-svh overflow-hidden border-r border-border bg-background p-10 text-foreground lg:flex lg:flex-col xl:p-14">
        <div className="relative z-10 flex h-full flex-col">
          <BrandMark />

          <div className="my-auto max-w-xl py-12">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <IconSparkles className="size-3.5" aria-hidden="true" />
              Keanggotaan Eksklusif
            </span>
            <h1 className="font-heading text-4xl leading-[1.1] font-semibold tracking-tight xl:text-5xl">
              Mulai pengalaman menginap terbaik Anda bersama Roomly.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
              Daftar sekarang untuk membuka akses reservasi instan, harga khusus
              member, dan pengelolaan pesanan yang transparan.
            </p>

            <ul className="mt-8 space-y-3.5 text-sm font-medium text-foreground">
              <li className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <IconCheck className="size-3.5" aria-hidden="true" />
                </span>
                Proses pemesanan cepat tanpa tersembunyi
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <IconCheck className="size-3.5" aria-hidden="true" />
                </span>
                Garansi harga dan penawaran terbaik
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <IconShieldCheck className="size-3.5" aria-hidden="true" />
                </span>
                Keamanan data pribadi terjamin
              </li>
            </ul>
          </div>

          <div className="flex items-end justify-between gap-8 border-t border-border pt-6 text-sm text-muted-foreground">
            <p>Roomly Hotel & Stays</p>
            <p>Pendaftaran Akun Baru</p>
          </div>
        </div>

        {/* Subtle Decorative Geometry */}
        <div
          className="absolute -right-28 bottom-24 size-80 rotate-12 rounded-[4rem] border border-border"
          aria-hidden="true"
        />
        <div
          className="absolute right-12 -bottom-20 h-52 w-28 rotate-12 bg-primary/80"
          aria-hidden="true"
        />
      </section>

      {/* Form Section */}
      <section className="flex min-h-svh flex-col px-4 py-6 sm:px-8 sm:py-10 lg:justify-center lg:px-12 xl:px-20">
        <div className="mb-10 lg:hidden">
          <BrandMark />
        </div>

        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle role="heading" aria-level={1}>
              Buat akun baru
            </CardTitle>
            <CardDescription>
              Isi formulir di bawah ini untuk mendaftar akun Roomly Anda.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FieldGroup>
                {/* Name Field */}
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Contoh: Budi Santoso"
                    className="h-11"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    {...register("name")}
                  />
                  <FieldError id="name-error" errors={[errors.name]} />
                </Field>

                {/* Email Field */}
                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="email">Alamat Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@email.com"
                    className="h-11"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    {...register("email")}
                  />
                  <FieldError id="email-error" errors={[errors.email]} />
                </Field>

                {/* Password Field */}
                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimal 8 karakter"
                      className="h-11 pr-10"
                      aria-invalid={!!errors.password}
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                    >
                      {showPassword ? (
                        <IconEyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <IconEye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {/* Password requirement hint */}
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                    <span
                      className={`inline-flex size-3.5 items-center justify-center rounded-full transition-colors ${
                        isMinLength
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <IconCheck className="size-2.5" />
                    </span>
                    <span
                      className={
                        isMinLength
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      Minimal 8 karakter
                    </span>
                  </div>

                  <FieldError id="password-error" errors={[errors.password]} />
                </Field>

                {/* Terms Acceptance Field */}
                <Field data-invalid={!!errors.terms}>
                  <Controller
                    name="terms"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-start gap-2.5 pt-1">
                        <Checkbox
                          id="terms"
                          className="mt-0.5 shrink-0"
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                          aria-invalid={!!errors.terms}
                          aria-describedby={
                            errors.terms ? "terms-error" : undefined
                          }
                        />
                        <Label
                          htmlFor="terms"
                          className="block text-xs leading-normal font-normal text-muted-foreground select-none cursor-pointer"
                        >
                          Saya menyetujui{" "}
                          <Link
                            href="/terms"
                            className="font-medium text-foreground underline hover:text-primary"
                          >
                            Syarat & Ketentuan
                          </Link>{" "}
                          serta{" "}
                          <Link
                            href="/privacy"
                            className="font-medium text-foreground underline hover:text-primary"
                          >
                            Kebijakan Privasi
                          </Link>{" "}
                          Roomly.
                        </Label>
                      </div>
                    )}
                  />
                  <FieldError id="terms-error" errors={[errors.terms]} />
                </Field>

                {/* Root Error Message */}
                {errors.root && <FieldError>{errors.root.message}</FieldError>}

                {/* Primary Call To Action */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <IconUserPlus aria-hidden="true" />
                  )}
                  Daftar Akun Roomly
                </Button>
              </FieldGroup>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Sudah memiliki akun?
            </p>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              disabled={isLoading}
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Masuk ke Akun Anda
            </Button>
          </CardFooter>
        </Card>

        <p className="mx-auto mt-6 max-w-md text-center text-xs leading-5 text-muted-foreground">
          Pendaftaran gratis tanpa biaya tersembunyi. Data Anda aman
          terlindungi.
        </p>
      </section>
    </main>
  );
}
