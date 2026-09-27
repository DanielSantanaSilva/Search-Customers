import { createApp } from './app.ts'
import { database } from './db/database.ts'
import { LeadService } from './services/lead-service.ts'

const port = Number(process.env.PORT ?? 8765)
const host = process.env.HOST ?? '127.0.0.1'
const app = await createApp(new LeadService(database))

await app.listen({ port, host })
