import { MongoClient, ServerApiVersion, type MongoClientOptions } from "mongodb"

// La conexion se crea de forma perezosa: recien cuando alguien hace
// `await clientPromise`. Antes el modulo leia MONGO_DB_URI y lanzaba al
// importarse, lo que hacia fallar `next build` cuando la variable no estaba
// definida en el entorno de compilacion (por ejemplo, en Vercel).

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

// En desarrollo se guarda en una global para sobrevivir a los recargos de HMR.
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let cached: Promise<MongoClient> | undefined

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGO_DB_URI

  if (!uri) {
    return Promise.reject(
      new Error(
        "Falta la variable de entorno MONGO_DB_URI. Definila en .env.local para desarrollo local, " +
          "o en Environment Variables del proyecto si corre en Vercel."
      )
    )
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, options).connect()
    }
    return global._mongoClientPromise
  }

  if (!cached) {
    cached = new MongoClient(uri, options).connect()
  }
  return cached
}

// Thenable: se comporta como una promesa para quien haga `await`,
// pero no abre la conexion hasta ese momento.
const clientPromise: PromiseLike<MongoClient> = {
  then(onfulfilled, onrejected) {
    return connect().then(onfulfilled, onrejected)
  },
}

export default clientPromise
