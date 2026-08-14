"use client";

import { useState } from "react";

interface SettingsClientProps {
  connectedChannels: Array<{
    platform: string;
    accountName: string | null;
    connected: boolean;
  }>;
  contentCount: number;
  publishedCount: number;
  scheduledCount: number;
  ideasCount: number;
}

const timezones = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const weekDays = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

type TabId = "profile" | "calendar" | "publishing" | "notifications" | "subscription";

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "calendar", label: "Calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "publishing", label: "Publishing", icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" },
  { id: "notifications", label: "Notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { id: "subscription", label: "Subscription", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
];

export default function SettingsClient({
  connectedChannels,
  contentCount,
  publishedCount,
  scheduledCount,
  ideasCount,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");

  // Calendar settings
  const [defaultView, setDefaultView] = useState("month");
  const [weekStart, setWeekStart] = useState("1");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("18:00");
  const [showWeekends, setShowWeekends] = useState(true);

  // Publishing settings
  const [defaultPlatform, setDefaultPlatform] = useState("LinkedIn");
  const [autoQueue, setAutoQueue] = useState(true);
  const [confirmBeforePublish, setConfirmBeforePublish] = useState(true);

  // Notification settings
  const [emailOnPublish, setEmailOnPublish] = useState(true);
  const [emailOnFail, setEmailOnFail] = useState(true);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Profile
  const [displayName, setDisplayName] = useState("Creator");
  const [email, setEmail] = useState("");

  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Settings</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Manage your workspace
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
            saved
              ? "bg-emerald-600 text-white"
              : "bg-white text-zinc-950 hover:bg-zinc-200"
          }`}
        >
          {saved ? "Saved" : "Save changes"}
        </button>
      </div>

      <div className="mt-8 flex gap-8">
        {/* Sidebar tabs */}
        <nav className="w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                activeTab === tab.id
                  ? "bg-zinc-800/60 text-white"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={tab.icon}
                />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* ─── Profile ─── */}
          {activeTab === "profile" && (
            <div className="space-y-8">
              <Section title="Profile" description="Your personal information and account details.">
                <div className="space-y-5">
                  <Field label="Display name">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="settings-input"
                      placeholder="Your name"
                    />
                  </Field>
                  <Field label="Email address">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="settings-input"
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Role">
                    <input
                      type="text"
                      className="settings-input"
                      placeholder="Content creator"
                      defaultValue=""
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Connected accounts" description={`${connectedChannels.length} platform(s) connected.`}>
                <div className="space-y-3">
                  {connectedChannels.length === 0 ? (
                    <p className="text-sm text-zinc-500">No accounts connected yet.</p>
                  ) : (
                    connectedChannels.map((ch) => (
                      <div
                        key={ch.platform}
                        className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                            {ch.platform[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{ch.platform}</p>
                            <p className="text-xs text-zinc-500">{ch.accountName ?? "Connected"}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* ─── Calendar ─── */}
          {activeTab === "calendar" && (
            <div className="space-y-8">
              <Section title="Calendar display" description="Customize how your content calendar looks and behaves.">
                <div className="space-y-5">
                  <Field label="Default view">
                    <div className="flex gap-2">
                      {["month", "week", "list"].map((view) => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setDefaultView(view)}
                          className={`rounded-lg border px-4 py-2 text-sm capitalize transition ${
                            defaultView === view
                              ? "border-white bg-white text-zinc-950"
                              : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                          }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Week starts on">
                    <select
                      value={weekStart}
                      onChange={(e) => setWeekStart(e.target.value)}
                      className="settings-input"
                    >
                      {weekDays.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Time zone">
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="settings-input"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Toggle
                    label="Show weekends"
                    description="Display Saturday and Sunday in month view."
                    checked={showWeekends}
                    onChange={setShowWeekends}
                  />
                </div>
              </Section>

              <Section title="Working hours" description="Set your active hours for scheduling and notifications.">
                <div className="flex items-center gap-4">
                  <Field label="Start">
                    <input
                      type="time"
                      value={workingHoursStart}
                      onChange={(e) => setWorkingHoursStart(e.target.value)}
                      className="settings-input"
                    />
                  </Field>
                  <Field label="End">
                    <input
                      type="time"
                      value={workingHoursEnd}
                      onChange={(e) => setWorkingHoursEnd(e.target.value)}
                      className="settings-input"
                    />
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {/* ─── Publishing ─── */}
          {activeTab === "publishing" && (
            <div className="space-y-8">
              <Section title="Publishing defaults" description="Configure how content is published across platforms.">
                <div className="space-y-5">
                  <Field label="Default platform">
                    <select
                      value={defaultPlatform}
                      onChange={(e) => setDefaultPlatform(e.target.value)}
                      className="settings-input"
                    >
                      {connectedChannels.length > 0 ? (
                        connectedChannels.map((ch) => (
                          <option key={ch.platform} value={ch.platform}>
                            {ch.platform}
                          </option>
                        ))
                      ) : (
                        <option value="LinkedIn">LinkedIn</option>
                      )}
                    </select>
                  </Field>

                  <Toggle
                    label="Auto-queue new content"
                    description="Automatically add new content to the publishing queue when created."
                    checked={autoQueue}
                    onChange={setAutoQueue}
                  />

                  <Toggle
                    label="Confirm before publishing"
                    description="Show a confirmation dialog before publishing content immediately."
                    checked={confirmBeforePublish}
                    onChange={setConfirmBeforePublish}
                  />
                </div>
              </Section>

              <Section title="Publishing channels" description={`${connectedChannels.length} connected. Manage channels from the Publishing center.`}>
                <div className="space-y-3">
                  {["LinkedIn", "Instagram", "YouTube", "X"].map((platform) => {
                    const connected = connectedChannels.find(
                      (ch) => ch.platform === platform,
                    );
                    return (
                      <div
                        key={platform}
                        className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                            {platform[0]}
                          </div>
                          <p className="text-sm font-medium text-white">{platform}</p>
                        </div>
                        {connected ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">Not connected</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            </div>
          )}

          {/* ─── Notifications ─── */}
          {activeTab === "notifications" && (
            <div className="space-y-8">
              <Section title="Email notifications" description="Choose which events trigger an email.">
                <div className="space-y-5">
                  <Toggle
                    label="Post published"
                    description="Receive an email when content is successfully published."
                    checked={emailOnPublish}
                    onChange={setEmailOnPublish}
                  />
                  <Toggle
                    label="Post failed"
                    description="Receive an email when a publication fails."
                    checked={emailOnFail}
                    onChange={setEmailOnFail}
                  />
                  <Toggle
                    label="Weekly digest"
                    description="Get a weekly summary of your publishing activity."
                    checked={emailWeeklyDigest}
                    onChange={setEmailWeeklyDigest}
                  />
                </div>
              </Section>

              <Section title="Browser notifications" description="In-app alerts and sounds.">
                <div className="space-y-5">
                  <Toggle
                    label="Push notifications"
                    description="Show browser notifications for publishing events."
                    checked={browserNotifications}
                    onChange={setBrowserNotifications}
                  />
                  <Toggle
                    label="Sound effects"
                    description="Play a sound when a post is published or fails."
                    checked={soundEnabled}
                    onChange={setSoundEnabled}
                  />
                </div>
              </Section>
            </div>
          )}

          {/* ─── Subscription ─── */}
          {activeTab === "subscription" && (
            <div className="space-y-8">
              <Section title="Current plan" description="You are on the free tier.">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">Free</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Basic content management and publishing.
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
                      Current
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Stat label="Ideas" value={ideasCount} />
                    <Stat label="Content" value={contentCount} />
                    <Stat label="Published" value={publishedCount} />
                    <Stat label="Scheduled" value={scheduledCount} />
                  </div>
                </div>
              </Section>

              <Section title="Upgrade" description="Unlock more power for your content workflow.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <PlanCard
                    name="Pro"
                    price="$19"
                    period="/month"
                    features={[
                      "Unlimited content",
                      "All publishing channels",
                      "AI content generation",
                      "Advanced analytics",
                      "Priority support",
                    ]}
                    highlighted
                  />
                  <PlanCard
                    name="Team"
                    price="$49"
                    period="/month"
                    features={[
                      "Everything in Pro",
                      "5 team members",
                      "Brand voice profiles",
                      "Custom integrations",
                      "Dedicated account manager",
                    ]}
                  />
                </div>
              </Section>

              <Section title="Billing history" description="Your recent invoices and payments.">
                <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950 px-5 py-8 text-center">
                  <p className="text-sm text-zinc-500">No billing history yet.</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Upgrade to a paid plan to start billing.
                  </p>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        :global(.settings-input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(39 39 42);
          background: rgb(9 9 11);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition: border-color 150ms;
        }
        :global(.settings-input:focus) {
          border-color: rgb(82 82 91);
        }
        :global(.settings-input option) {
          background: rgb(9 9 11);
          color: white;
        }
      `}</style>
    </div>
  );
}

/* ─── Reusable sub-components ─── */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-white" : "bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform ${
            checked
              ? "translate-x-5 bg-zinc-950"
              : "translate-x-0 bg-zinc-400"
          }`}
        />
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-center">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlighted
          ? "border-white bg-white/5"
          : "border-zinc-800 bg-zinc-950"
      }`}
    >
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{price}</span>
        <span className="text-sm text-zinc-500">{period}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-white">{name}</p>

      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
            <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`mt-5 w-full rounded-xl py-2.5 text-sm font-medium transition ${
          highlighted
            ? "bg-white text-zinc-950 hover:bg-zinc-200"
            : "border border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white"
        }`}
      >
        {highlighted ? "Upgrade to Pro" : "Upgrade to Team"}
      </button>
    </div>
  );
}
