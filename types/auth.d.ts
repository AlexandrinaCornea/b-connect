import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    name: string
    email: string
    city?: string | null
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      city?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    city?: string | null
  }
}
