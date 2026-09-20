import { APP_ORDER, APP_PATH, APP_TITLE } from '@/os/routes'

export default function NotFound() {
  return (
    <main id="content" className="wallpaper min-h-dvh grid place-items-center p-6">
      <div className="mono text-[13px] max-w-md">
        <p className="text-error">SIGSEGV — no such application</p>
        <p className="text-tertiary mt-2">
          Nothing is mounted at that path. The system is still running; only this
          route is missing.
        </p>
        <ul className="mt-5 grid gap-1">
          {APP_ORDER.map((id) => (
            <li key={id}>
              <a href={APP_PATH[id]} className="text-secondary hover:text-ok">
                → {APP_TITLE[id]}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
