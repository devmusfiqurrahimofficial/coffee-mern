import { useState } from "react";
import {
  CheckCircleIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "../../../redux/api/settingsApi/settingsApi";
import PageHeader from "./PageHeader";

const inputClass =
  "w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--color-primary)]";

export const StoreSettings = () => {
  const { data: settings, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [form, setForm] = useState({
    storeName: "",
    supportEmail: "",
    phone: "",
    address: "",
    standard: "60",
    express: "150",
    pickup: "0",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const [loadedSettings, setLoadedSettings] = useState(null);

  // Populate the form once settings arrive (adjusting state during render)
  if (settings && settings !== loadedSettings) {
    setLoadedSettings(settings);
    setForm({
      storeName: settings.storeName || "",
      supportEmail: settings.supportEmail || "",
      phone: settings.phone || "",
      address: settings.address || "",
      standard: String(settings.deliveryPrices?.standard ?? 60),
      express: String(settings.deliveryPrices?.express ?? 150),
      pickup: String(settings.deliveryPrices?.pickup ?? 0),
    });
  }

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    const prices = {
      standard: Number(form.standard),
      express: Number(form.express),
      pickup: Number(form.pickup),
    };
    if (Object.values(prices).some((value) => !Number.isFinite(value) || value < 0)) {
      setMessage({ type: "error", text: "Delivery prices must be zero or more." });
      return;
    }

    try {
      await updateSettings({
        storeName: form.storeName,
        supportEmail: form.supportEmail,
        phone: form.phone,
        address: form.address,
        deliveryPrices: prices,
      }).unwrap();
      setMessage({ type: "success", text: "Settings saved." });
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({
        type: "error",
        text: error?.data?.error || "Failed to save settings.",
      });
    }
  };

  if (isLoading) {
    return (
      <p className="rounded-2xl border border-black/5 bg-white px-5 py-10 text-center text-sm text-neutral-500 shadow-sm">
        Loading settings…
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Store Settings"
        description="Store details and delivery charges shown at checkout."
      />

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8"
      >
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[var(--color-text)]">
            <Cog6ToothIcon className="h-5 w-5 text-[var(--color-primary)]" />
            Store information
          </h2>
          <div>
            <label htmlFor="store-name" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Store name
            </label>
            <input
              id="store-name"
              type="text"
              value={form.storeName}
              onChange={updateField("storeName")}
              placeholder="Coffee Mern"
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="support-email" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Support email
              </label>
              <input
                id="support-email"
                type="email"
                value={form.supportEmail}
                onChange={updateField("supportEmail")}
                placeholder="support@coffeemern.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="store-phone" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Phone
              </label>
              <input
                id="store-phone"
                type="text"
                value={form.phone}
                onChange={updateField("phone")}
                placeholder="+8801XXXXXXXXX"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="store-address" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Address
            </label>
            <textarea
              id="store-address"
              rows={2}
              value={form.address}
              onChange={updateField("address")}
              placeholder="Shop 12, Gulshan Avenue, Dhaka"
              className={`${inputClass} resize-none`}
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-black/10 pt-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-[var(--color-text)]">
              Delivery charges (৳)
            </h2>
            <p className="text-xs text-neutral-500">
              Applied to every checkout and used by the order total.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="price-standard" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Standard
              </label>
              <input
                id="price-standard"
                type="number"
                min="0"
                value={form.standard}
                onChange={updateField("standard")}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="price-express" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Express
              </label>
              <input
                id="price-express"
                type="number"
                min="0"
                value={form.express}
                onChange={updateField("express")}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="price-pickup" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Store pickup
              </label>
              <input
                id="price-pickup"
                type="number"
                min="0"
                value={form.pickup}
                onChange={updateField("pickup")}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {message.text && (
          <p
            role="status"
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
              message.type === "success"
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary-hover)]"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <ExclamationCircleIcon className="h-4 w-4" />
            )}
            {message.text}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};
