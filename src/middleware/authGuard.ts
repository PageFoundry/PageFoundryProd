import { getUserFromCookie } from "@/lib/auth";


export async function requireUser() {
const user = await getUserFromCookie();
if (!user) {
return null;
}
return user; // { sub, role }
}


export async function requireAdmin() {
const user = await getUserFromCookie();
if (!user || user.role !== "ADMIN") {
return null;
}
return user;
}
