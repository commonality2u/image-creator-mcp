import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
 export async function save(buf: Buffer, name: string, saveDir: string) { // Expect absolute saveDir
   // Ensure the directory exists
   await mkdir(saveDir, { recursive: true });
   // Sanitize filename - Allow alphanumeric, dot, underscore, hyphen
   const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, '');
   const fullPath = path.join(saveDir, sanitizedName);
   await writeFile(fullPath, buf);
   return fullPath; // Return the full path where the file was saved
 }
