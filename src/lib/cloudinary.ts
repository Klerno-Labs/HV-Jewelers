import { v2 as cloudinary } from 'cloudinary'
import { serverEnv } from './env'

/**
 * Cloudinary server-side client. Configured lazily so the shell can run without
 * credentials during early development. Signed-upload flows (Phase 7) must use
 * this configured instance; never accept client-provided signatures.
 */

let configured = false

function configure() {
  if (configured) return
  if (
    !serverEnv.CLOUDINARY_CLOUD_NAME ||
    !serverEnv.CLOUDINARY_API_KEY ||
    !serverEnv.CLOUDINARY_API_SECRET
  ) {
    return
  }
  cloudinary.config({
    cloud_name: serverEnv.CLOUDINARY_CLOUD_NAME,
    api_key: serverEnv.CLOUDINARY_API_KEY,
    api_secret: serverEnv.CLOUDINARY_API_SECRET,
    secure: true,
  })
  configured = true
}

export function getCloudinary() {
  configure()
  if (!configured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_* env vars.')
  }
  return cloudinary
}

export function isCloudinaryConfigured() {
  return Boolean(
    serverEnv.CLOUDINARY_CLOUD_NAME &&
      serverEnv.CLOUDINARY_API_KEY &&
      serverEnv.CLOUDINARY_API_SECRET,
  )
}
