import type { Middleware } from "openapi-fetch";

export const JSONMimeTypeMiddleware: Middleware = {
  async onRequest({ request }) {
    // This is a temporary fix and should not be required regarding to the standard
    // Only set a default Accept if the request hasn't specified one (e.g. blob downloads set their own)
    if (!request.headers.has('Accept')) {
      request.headers.set('Accept', 'application/json')
    }

    return request
  },
}
