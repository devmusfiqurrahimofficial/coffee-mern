import { useAuth } from '../../../hooks/auth'

const formatToday = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

export const Welcome = () => {
  const { user } = useAuth()

  return (
    <header className="mb-8">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">
        {formatToday()}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-black leading-tight text-[var(--color-text)] md:text-4xl">
        Welcome back, {user?.displayName || "Admin"}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Here is what is happening with your store today.
      </p>
    </header>
  )
}
