import { getUserFromCookie } from "@/lib/auth";


export function requireUser() {
const user = getUserFromCookie();
if (!user) {
return null;
}
return user; // { sub, role }
}


export function requireAdmin() {
const user = getUserFromCookie();
if (!user || user.role !== "ADMIN") {
return null;
}
return user;
}