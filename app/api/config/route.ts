export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    apiBaseUrl:
      process.env.API_BASE_URL ?? "https://backend-t7zh.onrender.com",
    firestoreDatabaseId:
      process.env.FIRESTORE_DATABASE_ID ?? "waseda-study-hub",
    firebase: {
      apiKey:
        process.env.FIREBASE_API_KEY ??
        "AIzaSyCv_TZiTpmqWvCmdFauE9UH391qGwFVag8",
      authDomain:
        process.env.FIREBASE_AUTH_DOMAIN ??
        "waseda-study-hub.firebaseapp.com",
      projectId:
        process.env.FIREBASE_PROJECT_ID ?? "waseda-study-hub",
      appId:
        process.env.FIREBASE_APP_ID ??
        "1:484191730969:web:1ab2505b2c743aec48d988",
    },
  });
}
