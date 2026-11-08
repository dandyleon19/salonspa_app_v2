import { config } from "@vue/test-utils"
import { vi } from "vitest"

// Vuetify's overlays (dialogs, menus, the login form's loading overlay) read the visual viewport, which happy-dom
// does not provide.
vi.stubGlobal("visualViewport", {
  width: 1024,
  height: 768,
  offsetLeft: 0,
  offsetTop: 0,
  scale: 1,
  addEventListener: () => {},
  removeEventListener: () => {},
})

// Render <Transition> contents (the forms swap a skeleton for the form inside one) instead of VTU's empty stub.
config.global.stubs = { ...(config.global.stubs ?? {}), transition: false, "transition-group": false }
