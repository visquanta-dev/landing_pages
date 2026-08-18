export const DRYCLEANER_IMAGE_DIR = '/images/drycleaners'

export const DRYCLEANER_ASSETS = {
  heroBg: `${DRYCLEANER_IMAGE_DIR}/hero-bg.jpg`,
  heroCard: `${DRYCLEANER_IMAGE_DIR}/hero-card.jpg`,
}

const SERVICE_IMAGES: Record<string, string> = {
  'dry cleaning': `${DRYCLEANER_IMAGE_DIR}/dry-cleaning.jpg`,
  'wash & fold': `${DRYCLEANER_IMAGE_DIR}/wash-fold.jpg`,
  'wash and fold': `${DRYCLEANER_IMAGE_DIR}/wash-fold.jpg`,
  'pickup & delivery': `${DRYCLEANER_IMAGE_DIR}/pickup.jpg`,
  'pickup and delivery': `${DRYCLEANER_IMAGE_DIR}/pickup.jpg`,
  'alterations & repairs': `${DRYCLEANER_IMAGE_DIR}/alterations.jpg`,
  'alterations / repairs': `${DRYCLEANER_IMAGE_DIR}/alterations.jpg`,
}

export const DRYCLEANER_STATIC_FILENAMES = [
  'hero-bg.jpg',
  'hero-card.jpg',
  'dry-cleaning.jpg',
  'wash-fold.jpg',
  'pickup.jpg',
  'alterations.jpg',
]

export function dryCleanerServiceImage(name?: string | null) {
  if (!name) return DRYCLEANER_ASSETS.heroCard
  return SERVICE_IMAGES[name.trim().toLowerCase()] || DRYCLEANER_ASSETS.heroCard
}
