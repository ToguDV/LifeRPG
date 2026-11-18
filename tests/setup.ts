import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/*
  Testing Library only registers its own cleanup when the test globals exist.
  This suite imports from `vitest` explicitly, so cleanup is registered here.
*/
afterEach(() => {
  cleanup()
})

/*
  jsdom implements no layout: `scrollIntoView` and `scrollTo` are missing, and
  the picker wheels and listboxes call them on mount. The stubs do nothing,
  which is honest: no test asserts on scroll offsets.
*/
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}

if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = vi.fn() as unknown as Element['scrollTo']
}

/*
  `FileUploader` renders an image preview through an object URL. jsdom has no
  `URL.createObjectURL`, so the preview falls back to the icon without it.
*/
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:liferpg-test')
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn()
}
