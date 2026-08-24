"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { settingsSchema, type SettingsInput } from "@/app/admin/lib/schemas/settings";
import { updateSettings } from "@/app/admin/lib/actions/settings";
import type { PortfolioSettings } from "@/lib/supabase/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ImageUploader } from "@/app/admin/components/ImageUploader";
import { PageHeader } from "@/app/admin/components/PageHeader";

function toDefaults(s: PortfolioSettings): SettingsInput {
  return {
    name: s.name ?? "",
    jobTitle: s.job_title ?? "",
    about: s.about ?? "",
    location: s.location ?? "",
    availability: s.availability ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    whatsapp: s.whatsapp ?? "",
    github: s.github ?? "",
    linkedin: s.linkedin ?? "",
    facebook: s.facebook ?? "",
    instagram: s.instagram ?? "",
    twitter: s.twitter ?? "",
    resumeUrl: s.resume_url ?? "",
    metaTitle: s.meta_title ?? "",
    metaDescription: s.meta_description ?? "",
    ogImage: s.og_image ?? "",
    logo: s.logo ?? "",
    favicon: s.favicon ?? "",
    accentColor: s.accent_color ?? "",
    loader: s.loader ?? "",
  };
}

export function SettingsForm({ settings }: { settings: PortfolioSettings }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toDefaults(settings),
  });

  function onSubmit(values: SettingsInput) {
    startTransition(async () => {
      const result = await updateSettings(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Settings saved");
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <PageHeader
          title="Portfolio Settings"
          description="Drives the content shown across your public site."
          actions={
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          }
        />

        <Tabs defaultValue="personal">
          <TabsList className="flex-wrap">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="social">Social Links</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-5">
            <div className="grid grid-cols-1 gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:grid-cols-2 sm:p-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="jobTitle" render={({ field }) => (
                <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="availability" render={({ field }) => (
                <FormItem><FormLabel>Availability</FormLabel><FormControl><Input {...field} placeholder="Available for work" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="about" render={({ field }) => (
                <FormItem className="sm:col-span-2"><FormLabel>About</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="mt-5">
            <div className="grid grid-cols-1 gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:grid-cols-2 sm:p-6">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="whatsapp" render={({ field }) => (
                <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </TabsContent>

          <TabsContent value="social" className="mt-5">
            <div className="grid grid-cols-1 gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:grid-cols-2 sm:p-6">
              <FormField control={form.control} name="github" render={({ field }) => (
                <FormItem><FormLabel>GitHub</FormLabel><FormControl><Input {...field} placeholder="https://github.com/..." /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="linkedin" render={({ field }) => (
                <FormItem><FormLabel>LinkedIn</FormLabel><FormControl><Input {...field} placeholder="https://linkedin.com/in/..." /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="facebook" render={({ field }) => (
                <FormItem><FormLabel>Facebook</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="instagram" render={({ field }) => (
                <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="twitter" render={({ field }) => (
                <FormItem><FormLabel>X (Twitter)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </TabsContent>

          <TabsContent value="resume" className="mt-5">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
              <FormField control={form.control} name="resumeUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>CV / Resume URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                  <FormDescription>Upload via Media Library (Resume folder), then paste the file&apos;s URL here.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="mt-5">
            <div className="grid grid-cols-1 gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
              <FormField control={form.control} name="metaTitle" render={({ field }) => (
                <FormItem><FormLabel>Meta Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="metaDescription" render={({ field }) => (
                <FormItem><FormLabel>Meta Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="ogImage" render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Open Graph Image</FormLabel>
                  <ImageUploader folder="branding" label="OG image" value={field.value ?? ""} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>

          <TabsContent value="theme" className="mt-5">
            <div className="grid grid-cols-1 gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:grid-cols-2 sm:p-6">
              <FormField control={form.control} name="logo" render={({ field }) => (
                <FormItem className="max-w-[160px]">
                  <FormLabel>Logo</FormLabel>
                  <ImageUploader folder="branding" label="logo" aspect="aspect-square" value={field.value ?? ""} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="favicon" render={({ field }) => (
                <FormItem className="max-w-[160px]">
                  <FormLabel>Favicon</FormLabel>
                  <ImageUploader folder="branding" label="favicon" aspect="aspect-square" value={field.value ?? ""} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="accentColor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent Color</FormLabel>
                  <FormControl><Input {...field} placeholder="#978F66" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="loader" render={({ field }) => (
                <FormItem>
                  <FormLabel>Loader</FormLabel>
                  <FormControl><Input {...field} placeholder="Loader style or asset URL" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
