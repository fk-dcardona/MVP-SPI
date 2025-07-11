import { redirect } from 'next/navigation';

export default function MinimalRoot() {
  redirect('/minimal-app/login');
}