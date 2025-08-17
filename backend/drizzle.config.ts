import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

// .env 파일의 경로를 프로젝트 루트로 설정
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default defineConfig({
  schema: "./orm/schema/*.ts",
  out: "./orm/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
}); 