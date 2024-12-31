export default function EnvTest() {
    return (
      <div>
        <h1>Environment Test</h1>
        <pre>
          {JSON.stringify({
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          }, null, 2)}
        </pre>
      </div>
    )
  }