import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { revalidatePath } from 'next/cache'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  jobs: {
    tasks: [
      {
        slug: 'revalidate',
        handler: async () => {
          console.log('Revalidating...')
          try {
            revalidatePath('/')
            return {
              state: 'succeeded',
              output: null,
            }
          } catch (error) {
            console.error('Error revalidating:', error)
            return {
              state: 'failed',
              output: null,
            }
          }
        },
      },
    ],
    autoRun: [
      {
        queue: 'constantly',
        cron: '* * * * *',
      },
    ],
  },
  async onInit(payload) {
    console.info('Payload initialized, queueing revalidation job...')
    await payload.jobs.queue({
      task: 'revalidate',
      input: null,
      queue: 'constantly',
    })
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [],
})
