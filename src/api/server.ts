//@ts-nocheck
import { createServer } from 'miragejs';
import chats from '../api/chats.json'
import users from './users.json'

type Request<T> = {
    params: Record<string, keyof T>
}
export default function () {
    return createServer({
        routes() {
            this.get('/api/chat/:collectionName', (sch, req) => {
                const {collectionName} = req.params;
                return chats[collectionName]
            })

            this.get('/api/users/:collectionName', (sch, req: Request<typeof users>) => {
                const {collectionName} = req.params;
                return users[collectionName];
            })

            // Pass all unhandled routes through to the Vite proxy (real API)
            this.passthrough()
        }
    })
}
