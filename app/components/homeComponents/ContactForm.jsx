"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import emailjs from "@emailjs/browser";
import { countries, getFlagEmoji } from "./countries";
import SearchableSelect from "./SearchableSelect";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import {
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
} from "@/lib/emailjs";

function ContactForm() {
  const t = useTranslations("contact");
  const [country, setCountry] = useState(
    countries.find((c) => c.iso2 === "BD") ?? countries[0]
  );
  const [dialCode, setDialCode] = useState(
    countries.find((c) => c.iso2 === "BD") ?? countries[0]
  );
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleCountryChange = (next) => {
    setCountry(next);
    // Keep the phone code in step with the chosen country, but the user can
    // still override it independently afterwards.
    setDialCode(next);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear that field's error the moment they start fixing it, rather
    // than making them resubmit to find out it's gone.
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  // Phone is the only optional field here — validated only if the user
  // actually typed something into it.
  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = t("nameRequired");
    if (!formData.email.trim()) errors.email = t("emailRequired");
    else if (!isValidEmail(formData.email)) errors.email = t("emailInvalid");
    if (formData.phone.trim() && !isValidPhone(formData.phone)) errors.phone = t("phoneInvalid");
    if (!formData.message.trim()) errors.message = t("messageRequired");
    else if (formData.message.trim().length < 10) errors.message = t("messageTooShort");
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStatus("sending");

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          name: formData.name,
          email: formData.email,
          phone: `${dialCode.dialCode} ${formData.phone}`.trim(),
          country: country.name,
          title: "New Contact Form Submission",
          message: formData.message,
        },
        EMAILJS_PUBLIC_KEY
      );
      setStatus("success");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="flex items-center justify-center px-4 py-16 ">
      <div className="w-full max-w-5xl rounded-3xl border border-line bg-bg-elevated/80 backdrop-blur-xl p-8 shadow-2xl sm:p-10 lg:p-12">
        <h2 className="text-center text-4xl font-bold text-ink">
          {t("contactMe")}
        </h2>

        <p className="mt-2 mb-8 text-center text-ink-secondary">
          {t("letsDiscuss")}
        </p>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          {/* Name & Email */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                {t("name")}
              </label>

              <input
                type="text"
                name="name"
                value={formData.name ?? ""}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.name)}
                placeholder={t("enterYourNamePlaceholder")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-ink placeholder:text-ink-muted outline-none transition-all duration-300 focus:border-noir-gold ${
                  fieldErrors.name ? "border-red-400" : "border-line"
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1.5 text-xs font-medium text-red-400">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                {t("email")}
              </label>

              <input
                type="email"
                name="email"
                value={formData.email ?? ""}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.email)}
                placeholder={t("enterYourEmailPlaceholder")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-ink placeholder:text-ink-muted outline-none transition-all duration-300 focus:border-noir-gold ${
                  fieldErrors.email ? "border-red-400" : "border-line"
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-400">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          {/* Country & Phone */}
          <div className=" md:grid-cols-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                {t("country")}
              </label>

              <SearchableSelect
                items={countries}
                value={country}
                onChange={handleCountryChange}
                getKey={(c) => c.iso2}
                getSearchText={(c) => `${c.name} ${c.dialCode}`}
                searchPlaceholder={t("searchCountryPlaceholder")}
                triggerClassName="w-full"
                panelClassName="left-0 right-0"
                renderTrigger={(c) => (
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="text-lg leading-none">
                      {c ? getFlagEmoji(c.iso2) : "🌐"}
                    </span>
                    <span className="truncate">{c ? c.name : t("selectCountry")}</span>
                  </span>
                )}
                renderOption={(c) => (
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="text-lg leading-none">{getFlagEmoji(c.iso2)}</span>
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-ink-muted">
                      {c.dialCode}
                    </span>
                  </span>
                )}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                {t("phoneNumber")}
              </label>

              <div className="flex gap-2">
                <SearchableSelect
                  items={countries}
                  value={dialCode}
                  onChange={setDialCode}
                  getKey={(c) => c.iso2}
                  getSearchText={(c) => `${c.name} ${c.dialCode}`}
                  searchPlaceholder={t("searchCountryOrCodePlaceholder")}
                  triggerClassName="w-32 shrink-0 lg:w-36"
                  panelClassName="left-0 w-72 max-w-[calc(100vw-2.5rem)]"
                  renderTrigger={(c) => (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="text-lg leading-none">
                        {c ? getFlagEmoji(c.iso2) : "🌐"}
                      </span>
                      <span className="truncate">{c ? c.dialCode : "+.."}</span>
                    </span>
                  )}
                  renderOption={(c) => (
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="text-lg leading-none">{getFlagEmoji(c.iso2)}</span>
                      <span className="truncate">{c.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-ink-muted">
                        {c.dialCode}
                      </span>
                    </span>
                  )}
                />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone ?? ""}
                  onChange={handleChange}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  placeholder={t("phoneNumberPlaceholder")}
                  className={`min-w-0 flex-1 rounded-xl border bg-white/5 px-4 py-3 text-ink placeholder:text-ink-muted outline-none transition-all duration-300 focus:border-noir-gold ${
                    fieldErrors.phone ? "border-red-400" : "border-line"
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1.5 text-xs font-medium text-red-400">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              {t("message")}
            </label>

            <textarea
              rows={6}
              name="message"
              value={formData.message ?? ""}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.message)}
              placeholder={t("writeYourMessagePlaceholder")}
              className={`w-full resize-none rounded-xl border bg-white/5 px-4 py-3 text-ink placeholder:text-ink-muted outline-none transition-all duration-300 focus:border-noir-gold ${
                fieldErrors.message ? "border-red-400" : "border-line"
              }`}
            />
            {fieldErrors.message && (
              <p className="mt-1.5 text-xs font-medium text-red-400">{fieldErrors.message}</p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-xl bg-noir-gold py-4 text-lg font-semibold text-ink transition-all duration-300 hover:bg-noir-gold/85 hover:shadow-[0_0_35px_rgba(var(--accent-rgb),0.45)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "sending" ? t("sendingMessage") : t("sendMessage")}
          </button>

          {status === "success" && (
            <p className="text-center text-sm font-medium text-noir-gold">
              {t("sendMessageSuccess")}
            </p>
          )}
          {status === "error" && (
            <p className="text-center text-sm font-medium text-red-400">
              {t("sendMessageError")}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

export default ContactForm;
